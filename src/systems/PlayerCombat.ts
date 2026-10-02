import { PlayerStats } from "./PlayerStats";
import { WeaponSystem } from "./WeaponSystem";
import { DamageSystem } from "./DamageSystem";
import { Enemy } from "../entities/Enemy";

export interface AttackResult {
    success: boolean;
    /** Raw damage before armor reduction */
    rawDamage: number;
    /** Final damage after armor calculation */
    finalDamage: number;
    /** Whether the target died from this hit */
    killedTarget: boolean;
}

export interface PlayerDamageResult {
    incomingDamage: number;
    finalDamage: number;
    playerDied: boolean;
}

export class PlayerCombat {
    private readonly stats: PlayerStats;
    private readonly weapon: WeaponSystem;
    private readonly damageSystem: DamageSystem;

    /** Timestamp of the most recent attack start */
    private lastAttackTime = -Infinity;

    /** How long (ms) the attack animation window lasts */
    private readonly attackAnimDuration = 150;

    constructor(
        stats: PlayerStats,
        weapon: WeaponSystem,
        damageSystem: DamageSystem
    ) {
        this.stats = stats;
        this.weapon = weapon;
        this.damageSystem = damageSystem;
    }

    // ============================================================
    // Attack
    // ============================================================

    /**
     * Attempt to initiate an attack at currentTime.
     * Returns true if attack begins (cooldown cleared, not mid-swing).
     */
    attack(currentTime: number): boolean {
        if (this.isAttacking(currentTime)) {
            return false;
        }

        const cooldown = this.weapon.getAttackCooldown();

        if (currentTime - this.lastAttackTime < cooldown) {
            return false;
        }

        this.lastAttackTime = currentTime;
        return true;
    }

    /**
     * Apply damage to a target enemy/boss.
     * Uses WeaponSystem for raw damage and DamageSystem for armor calculation.
     */
    attackTarget(target: Enemy): AttackResult {
        const rawDamage = this.weapon.getDamage();

        const damageResult = this.damageSystem.calculateDamage(
            rawDamage,
            target.getArmor()
        );

        const actualDamage = target.takeDamage(damageResult.finalDamage);

        return {
            success: true,
            rawDamage,
            finalDamage: actualDamage,
            killedTarget: target.isDead(),
        };
    }

    // ============================================================
    // Receive damage
    // ============================================================

    /**
     * Apply incoming damage from an enemy/boss to the player.
     * Uses DamageSystem to calculate final damage after player's armor.
     */
    receiveDamage(incomingDamage: number): PlayerDamageResult {
        const damageResult = this.damageSystem.calculateDamage(
            incomingDamage,
            this.stats.getArmor()
        );

        this.stats.takeDamage(damageResult.finalDamage);

        return {
            incomingDamage,
            finalDamage: damageResult.finalDamage,
            playerDied: this.stats.isDead(),
        };
    }

    // ============================================================
    // State queries
    // ============================================================

    /**
     * Returns true if the player is currently in the attack animation window.
     * Pass currentTime to check at a specific point; otherwise uses Date.now().
     */
    isAttacking(currentTime?: number): boolean {
        const t = currentTime ?? Date.now();
        return t - this.lastAttackTime < this.attackAnimDuration;
    }

    canAttack(currentTime: number): boolean {
        if (this.isAttacking(currentTime)) {
            return false;
        }

        return (
            currentTime - this.lastAttackTime >=
            this.weapon.getAttackCooldown()
        );
    }

    getAttackPower(): number {
        return this.weapon.getDamage();
    }

    getAttackRange(): number {
        return this.weapon.getAttackRange();
    }
}