import type {
    BossSkillData,
} from "./BossSkillSystem";

import type {
    BossSkillState,
} from "./BossSkillState";

export interface BossSkillInfo {
    skill: BossSkillData;
    state: BossSkillState;
    remainingCooldown: number;
    available: boolean;
}