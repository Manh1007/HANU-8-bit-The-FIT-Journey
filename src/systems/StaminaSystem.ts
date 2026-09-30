import { PlayerStats } from "./PlayerStats";

export class StaminaSystem {
    private readonly stats: PlayerStats;

    private readonly dashCost = 5;
    private readonly dashDuration = 3000;

    private dashAvailable = true;
    private dashTimer?: ReturnType<typeof setTimeout>;

    constructor(stats: PlayerStats) {
        this.stats = stats;
    }

    canDash(): boolean {
        return (
            this.dashAvailable &&
            this.stats.getStamina() >= this.dashCost
        );
    }

    startDash(): boolean {
        if (!this.canDash()) {
            return false;
        }

        this.stats.consumeStamina(this.dashCost);

        this.dashAvailable = false;

        this.dashTimer = setTimeout(() => {
            this.dashAvailable = true;
        }, this.dashDuration);

        return true;
    }

    isDashAvailable(): boolean {
        return this.dashAvailable;
    }

    restoreStamina(amount: number): void {
        if (amount <= 0) {
            return;
        }

        this.stats.restoreStamina(amount);
    }

    usePotion(): boolean {
        return this.stats.usePotion();
    }

    getStamina(): number {
        return this.stats.getStamina();
    }

    getMaxStamina(): number {
        return this.stats.getMaxStamina();
    }

    getPotion(): number {
        return this.stats.getPotion();
    }

    destroy(): void {
        if (this.dashTimer) {
            clearTimeout(this.dashTimer);
            this.dashTimer = undefined;
        }
    }
}