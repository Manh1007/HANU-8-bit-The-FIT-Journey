import type { BossPhase } from "../bosses/BossBase";
import type { BossPhaseCombatData } from "../bosses/BossPhaseCombatData";

export class BossPhaseBehavior {
    private readonly phases:
        Map<BossPhase, BossPhaseCombatData>;

    constructor(
        phaseData: BossPhaseCombatData[]
    ) {
        this.phases =
            new Map<BossPhase, BossPhaseCombatData>();

        for (const data of phaseData) {
            this.validate(data);
            this.phases.set(
                data.phase,
                data
            );
        }
    }

    private validate(
        data: BossPhaseCombatData
    ): void {
        if (data.attackMultiplier <= 0) {
            throw new Error(
                "Boss phase attack multiplier must be greater than 0"
            );
        }

        if (data.armorBonus < 0) {
            throw new Error(
                "Boss phase armor bonus cannot be negative"
            );
        }

        if (data.skill1Multiplier <= 0) {
            throw new Error(
                "Boss phase skill1 multiplier must be greater than 0"
            );
        }

        if (data.skill2Multiplier <= 0) {
            throw new Error(
                "Boss phase skill2 multiplier must be greater than 0"
            );
        }
    }

    hasPhase(
        phase: BossPhase
    ): boolean {
        return this.phases.has(phase);
    }

    getPhaseData(
        phase: BossPhase
    ): BossPhaseCombatData | undefined {
        return this.phases.get(phase);
    }

    getAttackMultiplier(
        phase: BossPhase
    ): number {
        return (
            this.phases.get(phase)
                ?.attackMultiplier ?? 1
        );
    }

    getArmorBonus(
        phase: BossPhase
    ): number {
        return (
            this.phases.get(phase)
                ?.armorBonus ?? 0
        );
    }

    getSkillMultiplier(
        phase: BossPhase,
        skillId: "skill1" | "skill2"
    ): number {
        const data =
            this.phases.get(phase);

        if (!data) {
            return 1;
        }

        return skillId === "skill1"
            ? data.skill1Multiplier
            : data.skill2Multiplier;
    }
}