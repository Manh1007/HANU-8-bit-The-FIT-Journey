import { BossBase } from "../bosses/BossBase";
import type { BossCombatData } from "../bosses/BossCombatData";

export type BossSkillId =
    | "skill1"
    | "skill2";

export class BossCombatSystem {
    private readonly boss: BossBase;
    private readonly combatData: BossCombatData;

    constructor(
        boss: BossBase,
        combatData: BossCombatData
    ) {
        this.boss = boss;
        this.combatData = combatData;
    }

    calculateNormalDamage(): number {
        return this.boss.getAttack();
    }

    calculateCriticalDamage(): number {
        return (
            this.boss.getAttack() *
            this.combatData.criticalDamageMultiplier
        );
    }

    calculateSkillDamage(
        skill: BossSkillId
    ): number {
        const multiplier =
            skill === "skill1"
                ? this.combatData.skill1Multiplier
                : this.combatData.skill2Multiplier;

        return (
            this.boss.getAttack() *
            multiplier
        );
    }
}