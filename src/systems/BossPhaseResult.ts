import type { BossPhase } from "../bosses/BossBase";

export interface BossPhaseResult {
    changed: boolean;
    previousPhase: BossPhase;
    currentPhase: BossPhase;
}