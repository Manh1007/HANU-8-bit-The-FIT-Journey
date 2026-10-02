import { PlayerCombat, type AttackResult } from "./PlayerCombat";
import { Enemy } from "../entities/Enemy";
import { PlayerStats } from "./PlayerStats";

export type CombatState =
    | "idle"         // Not in combat
    | "engaging"     // In combat range, no attack yet
    | "attacking"    // Player is executing an attack
    | "hit"          // Player was hit by enemy
    | "player_dead"  // Player has died
    | "enemy_dead";  // Enemy has been killed

export interface CombatEngageResult {
    state: CombatState;
    playerAttack?: AttackResult;
    enemyDamageDealt?: number;
    playerHp: number;
    enemyHp: number;
}

/**
 * CombatManager — orchestrates turn/frame-based combat between
 * the Player and a single Enemy (or Boss, which extends Enemy).
 *
 * Responsibilities:
 * - Track combat state
 * - Detect if player is in attack range of target
 * - Execute player attack → enemy via PlayerCombat.attackTarget()
 * - Execute enemy attack → player via PlayerCombat.receiveDamage()
 * - Determine combat outcomes (kill, death)
 */
export class CombatManager {
    private readonly playerCombat: PlayerCombat;
    private readonly playerStats: PlayerStats;

    private state: CombatState = "idle";
    private activeTarget: Enemy | null = null;

    constructor(
        playerCombat: PlayerCombat,
        playerStats: PlayerStats
    ) {
        this.playerCombat = playerCombat;
        this.playerStats = playerStats;
    }

    // ============================================================
    // State management
    // ============================================================

    getState(): CombatState {
        return this.state;
    }

    isInCombat(): boolean {
        return this.state !== "idle";
    }

    getActiveTarget(): Enemy | null {
        return this.activeTarget;
    }

    // ============================================================
    // Engage / Disengage
    // ============================================================

    /**
     * Set a target to engage in combat.
     * Returns false if player is already dead or target is dead.
     */
    engageTarget(target: Enemy): boolean {
        if (this.playerStats.isDead()) {
            this.state = "player_dead";
            return false;
        }

        if (target.isDead()) {
            return false;
        }

        this.activeTarget = target;
        this.state = "engaging";
        return true;
    }

    /**
     * Exit combat, clearing the active target.
     */
    disengage(): void {
        this.activeTarget = null;
        this.state = "idle";
    }

    // ============================================================
    // Player → Enemy
    // ============================================================

    /**
     * Player attacks the active target.
     * Returns null if no target, player dead, or attack on cooldown.
     */
    playerAttack(currentTime: number): AttackResult | null {
        if (this.playerStats.isDead()) {
            this.state = "player_dead";
            return null;
        }

        if (!this.activeTarget || this.activeTarget.isDead()) {
            return null;
        }

        if (!this.playerCombat.attack(currentTime)) {
            // Still on cooldown
            return null;
        }

        this.state = "attacking";

        const result = this.playerCombat.attackTarget(
            this.activeTarget
        );

        if (this.activeTarget.isDead()) {
            this.state = "enemy_dead";
            this.activeTarget = null;
        } else {
            this.state = "engaging";
        }

        return result;
    }

    // ============================================================
    // Enemy → Player
    // ============================================================

    /**
     * Enemy attacks the player using its attack stat.
     * Damage passes through DamageSystem (player armor is applied
     * inside PlayerCombat.receiveDamage).
     */
    enemyAttacksPlayer(enemy: Enemy): number {
        if (!this.playerStats.isAlive()) {
            return 0;
        }

        const incomingDamage = enemy.getAttack();

        const result = this.playerCombat.receiveDamage(incomingDamage);

        if (result.playerDied) {
            this.state = "player_dead";
        } else {
            this.state = "hit";
        }

        return result.finalDamage;
    }

    // ============================================================
    // Range detection (pure, no Phaser dependency)
    // ============================================================

    /**
     * Check if a point (px, py) is within attack range of a point (tx, ty).
     * Used by scene/controller to decide if player can hit target.
     */
    isInAttackRange(
        px: number,
        py: number,
        tx: number,
        ty: number
    ): boolean {
        const dx = px - tx;
        const dy = py - ty;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.playerCombat.getAttackRange();
    }
}
