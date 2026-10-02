import { BossBase } from "../bosses/BossBase";
import {
    BossSkillSystem,
    type BossSkillId,
} from "./BossSkillSystem";

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
    ): number {
        const skill =
            this.skillSystem.getSkill(skillId);

        if (!skill) {
            return 0;
        }

        if (
            !this.skillSystem.useSkill(
                skillId,
                currentTime
            )
        ) {
            return 0;
        }

        return (
            this.boss.getAttack() *
            skill.damageMultiplier
        );
    }
}