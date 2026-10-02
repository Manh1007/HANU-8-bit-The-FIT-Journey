import type { BossSkillData } from "./BossSkillSystem";

export class BossSkillValidator {
    validate(
        skill: BossSkillData
    ): boolean {
        if (
            skill.damageMultiplier <= 0
        ) {
            return false;
        }

        if (
            skill.cooldown < 0
        ) {
            return false;
        }

        return true;
    }
}