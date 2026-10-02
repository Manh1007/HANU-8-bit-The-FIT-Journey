import { BossBase } from "../bosses/BossBase";
import {
    BossSkillSystem,
    type BossSkillId,
} from "./BossSkillSystem";
import type { BossSkillResult } from "./BossSkillResult";

export class BossSkillExecutor {
    private readonly boss: BossBase;
    private readonly skillSystem: BossSkillSystem;

    constructor(
        boss: BossBase,
        skillSystem: BossSkillSystem
    ) {
        this.boss = boss;
        this.skillSystem = skillSystem;
    }

    executeSkill(
        skillId: BossSkillId,
        currentTime: number
    ): BossSkillResult {
        const skill =
            this.skillSystem.getSkill(skillId);

        if (!skill) {
            return {
                success: false,
                skillId,
                damage: 0,
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
            };
        }

        const damage =
            this.boss.getAttack() *
            skill.damageMultiplier;

        return {
            success: true,
            skillId,
            damage,
        };
    }
}