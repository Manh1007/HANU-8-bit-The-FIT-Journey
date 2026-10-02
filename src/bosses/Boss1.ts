import {
    BossBase,
    type BossPhase,
    type BossData,
} from "./BossBase";

import type { BossCombatData } from "./BossCombatData";

import type { BossPhaseCombatData } from "./BossPhaseCombatData";

const boss1Data: BossData = {
    id: "boss-1",
    name: "Boss 1",
    maxHp: 300,
    attack: 10,
    armor: 5,
    maxPhases: 2,
    phases: [
        {
            phase: 1,
            hpThreshold: 1,
        },
        {
            phase: 2,
            hpThreshold: 0.5,
        },
    ],
};

const boss1CombatData: BossCombatData = {
    criticalChance: 0.4,
    criticalDamageMultiplier: 1.7,
    skill1Multiplier: 2.0,
    skill2Multiplier: 3.5,
};

const boss1PhaseCombatData:
    BossPhaseCombatData[] = [
        {
            phase: 1,
            attackMultiplier: 1.0,
            armorBonus: 0,
            skill1Multiplier: 2.0,
            skill2Multiplier: 3.5,
        },
        {
            phase: 2,
            attackMultiplier: 1.2,
            armorBonus: 15,
            skill1Multiplier: 2.5,
            skill2Multiplier: 4.0,
        },
    ];

export class Boss1 extends BossBase {
    private readonly combatData:
        BossCombatData;

    private readonly phaseCombatData:
        BossPhaseCombatData[];

    private readonly appliedPhaseBonuses:
        Set<BossPhase> = new Set();

    constructor() {
        super(boss1Data);

        this.combatData =
            boss1CombatData;

        this.phaseCombatData =
            boss1PhaseCombatData;
    }

    getCombatData(): BossCombatData {
        return this.combatData;
    }

    getPhaseCombatData():
        BossPhaseCombatData[] {
        return this.phaseCombatData;
    }

    protected override onPhaseAdvanced(
        _previousPhase: BossPhase,
        newPhase: BossPhase
    ): void {
        if (this.appliedPhaseBonuses.has(newPhase)) {
            return;
        }

        const data = this.phaseCombatData.find(
            (p) => p.phase === newPhase
        );

        if (data && data.armorBonus > 0) {
            this.setArmor(
                this.getArmor() + data.armorBonus
            );
            this.appliedPhaseBonuses.add(newPhase);
        }
    }
}