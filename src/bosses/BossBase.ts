import { Enemy, type EnemyData } from "../entities/Enemy";

export type BossState =
    | "idle"
    | "active"
    | "defeated";

export type BossPhase = 1 | 2 | 3;

export interface BossPhaseConfig {
    phase: BossPhase;
    hpThreshold: number;
}

export interface BossData extends EnemyData {
    maxPhases: BossPhase;
    phases: BossPhaseConfig[];
}

export abstract class BossBase extends Enemy {
    private readonly maxPhases: BossPhase;

    private readonly phases: BossPhaseConfig[];

    private currentPhase: BossPhase = 1;

    private state: BossState = "idle";

    constructor(data: BossData) {
        super(data);

        this.maxPhases = data.maxPhases;

        for (const phase of data.phases) {
            if (
                phase.phase > this.maxPhases ||
                !this.isValidThreshold(
                    phase.hpThreshold
                )
            ) {
                throw new Error(
                    `Invalid boss phase configuration: ${phase.phase}`
                );
            }
        }

        this.phases = data.phases;
    }

    private isValidThreshold(
        threshold: number
    ): boolean {
        return threshold >= 0 && threshold <= 1;
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

    getPhaseConfig(
        phase: BossPhase
    ): BossPhaseConfig | undefined {
        return this.phases.find(
            (config) => config.phase === phase
        );
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
        const nextPhase = (
            this.currentPhase + 1
        ) as BossPhase;

        const config = this.getPhaseConfig(
            nextPhase
        );

        if (!config) {
            return false;
        }

        return (
            this.getHpPercentage() <=
            config.hpThreshold
        );
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

        const previousPhase = this.currentPhase;

        this.currentPhase = (
            this.currentPhase + 1
        ) as BossPhase;

        this.onPhaseAdvanced(
            previousPhase,
            this.currentPhase
        );

        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected onPhaseAdvanced(
        _previousPhase: BossPhase,
        _newPhase: BossPhase
    ): void {
        // Subclasses can override this to apply phase-specific bonuses
    }

    protected markDefeated(): void {
        this.state = "defeated";
    }
}