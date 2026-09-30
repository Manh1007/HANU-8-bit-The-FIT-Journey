import { Enemy, type EnemyData } from "../entities/Enemy";

export type BossState =
    | "idle"
    | "active"
    | "defeated";

export type BossPhase = 1 | 2 | 3;

export interface BossData extends EnemyData {
    maxPhases: BossPhase;
}

export abstract class BossBase extends Enemy {
    private readonly maxPhases: BossPhase;

    private currentPhase: BossPhase = 1;

    private state: BossState = "idle";

    constructor(data: BossData) {
        super(data);

        this.maxPhases = data.maxPhases;
    }

    takeDamage(amount: number): number {
        const actualDamage = super.takeDamage(amount);

        if (this.isDead()) {
            this.markDefeated();
        }

        return actualDamage;
    }

    getCurrentPhase(): BossPhase {
        return this.currentPhase;
    }

    getMaxPhases(): BossPhase {
        return this.maxPhases;
    }

    getState(): BossState {
        return this.state;
    }

    startBattle(): void {
        if (this.isDead()) {
            return;
        }

        this.state = "active";
    }

    canAdvancePhase(): boolean {
        return (
            this.state === "active" &&
            this.currentPhase < this.maxPhases &&
            this.isAlive()
        );
    }

    protected shouldAdvancePhase(): boolean {
        return false;
    }

    updatePhase(): boolean {
        if (!this.canAdvancePhase()) {
            return false;
        }

        if (!this.shouldAdvancePhase()) {
            return false;
        }

        return this.advancePhase();
    }

    advancePhase(): boolean {
        if (!this.canAdvancePhase()) {
            return false;
        }

        this.currentPhase = (
            this.currentPhase + 1
        ) as BossPhase;

        return true;
    }

    protected markDefeated(): void {
        this.state = "defeated";
    }
}