import { BossBase } from "../bosses/BossBase";
import {
    BossSkillSystem,
    type BossSkillId,
} from "./BossSkillSystem";
import type { BossSkillResult } from "./BossSkillResult";
import type { BossCombatData } from "../bosses/BossCombatData";

export class BossSkillExecutor {
    private readonly boss: BossBase;
    private readonly skillSystem: BossSkillSystem;
    private readonly combatData: BossCombatData;

    constructor(
        boss: BossBase,
        skillSystem: BossSkillSystem,
        combatData: BossCombatData
    ) {
        this.boss = boss;
        this.skillSystem = skillSystem;
        this.combatData = combatData;
    }

    executeSkill(
        skillId: BossSkillId,
        currentTime: number,
        randomValue: number
    ): BossSkillResult {
        const skill =
            this.skillSystem.getSkill(skillId);

        if (!skill) {
            return {
                success: false,
                skillId,
                damage: 0,
                critical: false,
            };
        }

        if (
            !this.skillSystem.useSkill(
                skillId,
                currentTime
            )
        ) {
            return {
                success: false,
                skillId,
                damage: 0,
                critical: false,
            };
        }

        const isCritical =
            randomValue >= 0 &&
            randomValue <
                this.combatData.criticalChance;

        let damage =
            this.boss.getAttack() *
            skill.damageMultiplier;

        if (isCritical) {
            damage *=
                this.combatData
                    .criticalDamageMultiplier;
        }

        return {
            success: true,
            skillId,
            damage,
            critical: isCritical,
        };
    }
}