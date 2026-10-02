import type { BossPhase } from "./BossBase";

export interface BossPhaseCombatData {
    phase: BossPhase;
    attackMultiplier: number;
    armorBonus: number;
    skill1Multiplier: number;
    skill2Multiplier: number;
}