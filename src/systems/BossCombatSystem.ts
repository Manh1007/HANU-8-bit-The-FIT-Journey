import { BossBase } from "../bosses/BossBase";
import type { BossCombatData } from "../bosses/BossCombatData";
import { BossPhaseBehavior } from "./BossPhaseBehavior";

export class BossCombatSystem {
    private readonly boss: BossBase;

    private readonly combatData:
        BossCombatData;

    private readonly phaseBehavior:
        BossPhaseBehavior;

    constructor(
        boss: BossBase,
        combatData: BossCombatData,
        phaseBehavior?: BossPhaseBehavior
    ) {
        this.boss = boss;
        this.combatData = combatData;

        this.phaseBehavior =
            phaseBehavior ??
            new BossPhaseBehavior([]);
    }

    calculateNormalDamage(): number {
        const phase =
            this.boss.getCurrentPhase();

        const multiplier =
            this.phaseBehavior
                .getAttackMultiplier(phase);

        return (
            this.boss.getAttack() *
            multiplier
        );
    }

    calculateCriticalDamage(): number {
        return (
            this.calculateNormalDamage() *
            this.combatData
                .criticalDamageMultiplier
        );
    }

    calculateSkillDamage(
        skill: "skill1" | "skill2"
    ): number {
        const phase =
            this.boss.getCurrentPhase();

        // Use phase-specific multiplier if available,
        // otherwise fall back to base combatData multiplier
        let multiplier: number;

        if (this.phaseBehavior.hasPhase(phase)) {
            multiplier =
                this.phaseBehavior
                    .getSkillMultiplier(
                        phase,
                        skill
                    );
        } else {
            multiplier =
                skill === "skill1"
                    ? this.combatData.skill1Multiplier
                    : this.combatData.skill2Multiplier;
        }

        return (
            this.boss.getAttack() *
            multiplier
        );
    }

    rollCritical(
        randomValue: number
    ): boolean {
        return (
            randomValue >= 0 &&
            randomValue <
                this.combatData.criticalChance
        );
    }

    getCurrentPhase(): number {
        return this.boss
            .getCurrentPhase();
    }

    getPhaseBehavior():
        BossPhaseBehavior {
        return this.phaseBehavior;
    }
}