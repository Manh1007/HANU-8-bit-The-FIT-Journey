import {
    BossBase,
    type BossPhase,
    type BossData,
} from "./BossBase";

import type { BossCombatData } from "./BossCombatData";

import type { BossPhaseCombatData } from "./BossPhaseCombatData";

import type { BossSkillData } from "../systems/BossSkillSystem";

const boss2Data: BossData = {
    id: "boss-2",
    name: "Boss 2",
    maxHp: 500,
    attack: 16,
    armor: 10,
    maxPhases: 2,
    phases: [
        {
            phase: 1,
            hpThreshold: 1.0,
        },
        {
            phase: 2,
            hpThreshold: 0.5,
        },
    ],
};

const boss2CombatData: BossCombatData = {
    criticalChance: 0.35,
    criticalDamageMultiplier: 1.8,
    skill1Multiplier: 2.0,
    skill2Multiplier: 3.5,
};

const boss2PhaseCombatData: BossPhaseCombatData[] = [
    {
        phase: 1,
        attackMultiplier: 1.0,
        armorBonus: 0,
        skill1Multiplier: 2.0,
        skill2Multiplier: 3.5,
    },
    {
        phase: 2,
        attackMultiplier: 1.3,
        armorBonus: 20,
        skill1Multiplier: 2.8,
        skill2Multiplier: 4.5,
    },
];

export class Boss2 extends BossBase {
    private readonly combatData: BossCombatData;

    private readonly phaseCombatData: BossPhaseCombatData[];

    private readonly appliedPhaseBonuses: Set<BossPhase> = new Set();

    constructor() {
        super(boss2Data);

        this.combatData = boss2CombatData;

        this.phaseCombatData = boss2PhaseCombatData;
    }

    getCombatData(): BossCombatData {
        return this.combatData;
    }

    getPhaseCombatData(): BossPhaseCombatData[] {
        return this.phaseCombatData;
    }

    getSkillData(): BossSkillData[] {
        return [
            {
                id: "skill1",
                name: "Skill 1",
                damageMultiplier: 2.0,
                cooldown: 3000,
            },
            {
                id: "skill2",
                name: "Skill 2",
                damageMultiplier: 3.5,
                cooldown: 5000,
            },
        ];
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
