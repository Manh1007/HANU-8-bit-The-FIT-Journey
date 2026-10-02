import type { BossSkillResult } from "./BossSkillResult";

export interface BossCombatResult {
    success: boolean;
    skillResult: BossSkillResult;
    finalDamage: number;
}