import { PlayerStats } from "./PlayerStats";

export class PlayerCombat {
    private readonly stats: PlayerStats;

    private attacking = false;

    private readonly attackCooldown = 400;
    private lastAttackTime = 0;

    constructor(stats: PlayerStats) {
        this.stats = stats;
    }

    attack(currentTime: number): boolean {
        if (this.attacking) {
            return false;
        }

        if (
            currentTime - this.lastAttackTime <
            this.attackCooldown
        ) {
            return false;
        }

        this.attacking = true;
        this.lastAttackTime = currentTime;

        console.log(
            "Player attacks with power:",
            this.stats.getAttack()
        );

        this.resetAttackState();

        return true;
    }

    isAttacking(): boolean {
        return this.attacking;
    }

    getAttackPower(): number {
        return this.stats.getAttack();
    }

    private resetAttackState(): void {
        setTimeout(() => {
            this.attacking = false;
        }, 150);
    }
}