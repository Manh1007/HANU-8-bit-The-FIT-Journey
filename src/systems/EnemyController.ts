import { Enemy } from "../entities/Enemy";

// ============================================================
// Types
// ============================================================

export type EnemyState =
    | "idle"
    | "patrol"
    | "alert"     // Detected player (one-frame transition)
    | "chase"
    | "attack"
    | "hurt"
    | "death";

export interface EnemyPosition {
    x: number;
    y: number;
}

export interface EnemyControllerConfig {
    /** How often patrol changes direction (ms). 0 = immediate. */
    patrolInterval: number;
    /** Distance at which enemy detects player */
    detectionRange: number;
    /** Distance at which enemy stops chasing */
    chaseDropRange: number;
    /** Distance at which enemy initiates an attack */
    attackRange: number;
    /** Cooldown between enemy attacks (ms) */
    attackCooldown: number;
    /** How long the hurt state lasts (ms) */
    hurtDuration: number;
    /** Movement speed while patrolling (units/sec) */
    patrolSpeed: number;
    /** Movement speed while chasing (units/sec) */
    chaseSpeed: number;
}

export const DEFAULT_ENEMY_CONFIG: EnemyControllerConfig = {
    patrolInterval: 2000,
    detectionRange: 120,
    chaseDropRange: 200,
    attackRange: 40,
    attackCooldown: 1200,
    hurtDuration: 300,
    patrolSpeed: 40,
    chaseSpeed: 80,
};

export interface EnemyUpdateResult {
    state: EnemyState;
    didAttack: boolean;
    attackDamage: number;
    died: boolean;
}

/**
 * EnemyController — pure state machine for one enemy.
 *
 * Does NOT depend on Phaser. Positions and distances are plain numbers.
 * The Scene/Game update loop calls `update(dt, currentTime, playerPos)`
 * and applies the resulting velocities / triggers animations.
 *
 * State machine:
 *   idle ←→ patrol → (detect player) → chase → attack
 *   any state → (take lethal damage) → death
 *   any state → (take damage) → hurt → (recover) → chase / idle
 */
export class EnemyController {
    private readonly enemy: Enemy;
    private readonly config: EnemyControllerConfig;

    private state: EnemyState = "idle";

    private position: EnemyPosition;

    /** Patrol direction (-1 or 1) on the X axis */
    private patrolDirection = 1;
    private lastPatrolChange = 0;

    /** Velocity values exposed for Scene to apply to sprite */
    private velocityX = 0;
    private velocityY = 0;

    private lastAttackTime = -Infinity;
    private hurtEndTime = -Infinity;

    constructor(
        enemy: Enemy,
        initialPosition: EnemyPosition,
        config: EnemyControllerConfig = DEFAULT_ENEMY_CONFIG
    ) {
        this.enemy = enemy;
        this.config = config;
        this.position = { ...initialPosition };
    }

    // ============================================================
    // Core update
    // ============================================================

    /**
     * Tick the state machine.
     * @param dt          - Delta time in milliseconds
     * @param currentTime - Absolute timestamp (e.g. performance.now())
     * @param playerPos   - Current player position (null if player not present)
     */
    update(
        dt: number,
        currentTime: number,
        playerPos: EnemyPosition | null
    ): EnemyUpdateResult {
        const result: EnemyUpdateResult = {
            state: this.state,
            didAttack: false,
            attackDamage: 0,
            died: false,
        };

        if (this.state === "death") {
            result.died = true;
            return result;
        }

        // ---- Recover from hurt ----
        if (this.state === "hurt") {
            if (currentTime >= this.hurtEndTime) {
                this.state = playerPos ? "chase" : "idle";
            }
            this.velocityX = 0;
            this.velocityY = 0;
            result.state = this.state;
            return result;
        }

        const distToPlayer = playerPos
            ? this.distanceTo(playerPos)
            : Infinity;

        // ---- Priority: detect player supersedes everything in non-combat ----
        if (
            this.state !== "chase" &&
            this.state !== "attack" &&
            playerPos !== null &&
            distToPlayer <= this.config.detectionRange
        ) {
            this.state = "chase";
        }

        // ---- State dispatch ----
        switch (this.state) {
            case "idle":
                this.handleIdle(currentTime);
                break;

            case "patrol":
                this.handlePatrol(dt, currentTime);
                break;

            case "alert":
                // alert is a pass-through: immediately resolve to chase or idle
                this.state = distToPlayer <= this.config.detectionRange
                    ? "chase"
                    : "idle";
                break;

            case "chase":
                this.handleChase(dt, playerPos, distToPlayer, result, currentTime);
                break;

            case "attack":
                this.handleAttack(currentTime, distToPlayer, result);
                break;
        }

        result.state = this.state;
        return result;
    }

    // ============================================================
    // Handlers per state
    // ============================================================

    private handleIdle(currentTime: number): void {
        this.velocityX = 0;
        this.velocityY = 0;

        // Transition to patrol after patrolInterval
        if (currentTime - this.lastPatrolChange >= this.config.patrolInterval) {
            this.state = "patrol";
            this.lastPatrolChange = currentTime;
        }
    }

    private handlePatrol(
        dt: number,
        currentTime: number
    ): void {
        // Reverse direction periodically
        if (currentTime - this.lastPatrolChange >= this.config.patrolInterval) {
            this.patrolDirection *= -1;
            this.lastPatrolChange = currentTime;
            this.state = "idle"; // brief idle between patrol legs
            this.velocityX = 0;
            this.velocityY = 0;
            return;
        }

        const speed = this.config.patrolSpeed;
        this.velocityX = this.patrolDirection * speed;
        this.velocityY = 0;

        // Apply movement to position
        this.position.x += this.velocityX * (dt / 1000);
    }

    private handleChase(
        dt: number,
        playerPos: EnemyPosition | null,
        distToPlayer: number,
        result: EnemyUpdateResult,
        currentTime: number
    ): void {
        if (!playerPos || distToPlayer > this.config.chaseDropRange) {
            this.state = "idle";
            this.velocityX = 0;
            this.velocityY = 0;
            return;
        }

        if (distToPlayer <= this.config.attackRange) {
            this.state = "attack";
            this.velocityX = 0;
            this.velocityY = 0;
            // Process attack in same frame
            this.handleAttack(currentTime, distToPlayer, result);
            return;
        }

        // Move toward player
        const dx = playerPos.x - this.position.x;
        const dy = playerPos.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const speed = this.config.chaseSpeed;
            this.velocityX = (dx / dist) * speed;
            this.velocityY = (dy / dist) * speed;
            this.position.x += this.velocityX * (dt / 1000);
            this.position.y += this.velocityY * (dt / 1000);
        }
    }

    private handleAttack(
        currentTime: number,
        distToPlayer: number,
        result: EnemyUpdateResult
    ): void {
        this.velocityX = 0;
        this.velocityY = 0;

        // If player moved out of attack range, resume chase
        if (distToPlayer > this.config.attackRange) {
            this.state = "chase";
            return;
        }

        if (currentTime - this.lastAttackTime >= this.config.attackCooldown) {
            this.lastAttackTime = currentTime;
            result.didAttack = true;
            result.attackDamage = this.enemy.getAttack();
        }
    }

    // ============================================================
    // Receive damage (called by CombatManager / Scene)
    // ============================================================

    /**
     * Called when this enemy takes damage from an external source.
     * Returns false if enemy is already dead.
     */
    takeDamage(
        amount: number,
        currentTime: number
    ): boolean {
        if (this.state === "death") {
            return false;
        }

        this.enemy.takeDamage(amount);

        if (this.enemy.isDead()) {
            this.state = "death";
            this.velocityX = 0;
            this.velocityY = 0;
            return true;
        }

        // Enter hurt state
        this.state = "hurt";
        this.hurtEndTime = currentTime + this.config.hurtDuration;
        this.velocityX = 0;
        this.velocityY = 0;

        return true;
    }

    // ============================================================
    // Accessors
    // ============================================================

    getState(): EnemyState {
        return this.state;
    }

    getEnemy(): Enemy {
        return this.enemy;
    }

    getPosition(): EnemyPosition {
        return { ...this.position };
    }

    setPosition(pos: EnemyPosition): void {
        this.position = { ...pos };
    }

    getVelocityX(): number {
        return this.velocityX;
    }

    getVelocityY(): number {
        return this.velocityY;
    }

    isAlive(): boolean {
        return this.enemy.isAlive();
    }

    isDead(): boolean {
        return this.state === "death";
    }

    distanceTo(target: EnemyPosition): number {
        const dx = this.position.x - target.x;
        const dy = this.position.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
