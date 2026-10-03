import {
    BossBase,
    type BossPhase,
    type BossData,
} from "./BossBase";

import type { BossCombatData } from "./BossCombatData";

import type { BossPhaseCombatData } from "./BossPhaseCombatData";

import type { BossSkillData } from "../systems/BossSkillSystem";

const boss3Data: BossData = {
    id: "boss-3",
    name: "Boss 3",
    maxHp: 800,
    attack: 24,
    armor: 15,
    maxPhases: 3,
    phases: [
        {
            phase: 1,
            hpThreshold: 1.0,
        },
        {
            phase: 2,
            hpThreshold: 0.6667,
        },
        {
            phase: 3,
            hpThreshold: 0.3333,
        },
    ],
};

const boss3CombatData: BossCombatData = {
    criticalChance: 0.30,
    criticalDamageMultiplier: 2.0,
    skill1Multiplier: 2.2,
    skill2Multiplier: 4.0,
};

const boss3PhaseCombatData: BossPhaseCombatData[] = [
    {
        phase: 1,
        attackMultiplier: 1.0,
        armorBonus: 0,
        skill1Multiplier: 2.2,
        skill2Multiplier: 4.0,
    },
    {
        phase: 2,
        attackMultiplier: 1.25,
        armorBonus: 20,
        skill1Multiplier: 3.0,
        skill2Multiplier: 5.0,
    },
    {
        phase: 3,
        attackMultiplier: 1.5,
        armorBonus: 35,
        skill1Multiplier: 3.8,
        skill2Multiplier: 6.0,
    },
];

export class Boss3 extends BossBase {
    private readonly combatData: BossCombatData;

    private readonly phaseCombatData: BossPhaseCombatData[];

    private readonly appliedPhaseBonuses: Set<BossPhase> = new Set();

    constructor() {
        super(boss3Data);

        this.combatData = boss3CombatData;

        this.phaseCombatData = boss3PhaseCombatData;
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
                damageMultiplier: 2.2,
                cooldown: 2500,
            },
            {
                id: "skill2",
                name: "Skill 2",
                damageMultiplier: 4.0,
                cooldown: 4500,
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
