import {
    BossBase,
    type BossData,
} from "./BossBase";
import type { BossCombatData } from "./BossCombatData";

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

export class Boss1 extends BossBase {
    private readonly phaseTwoArmorBonus = 15;
    private readonly combatData: BossCombatData;

    constructor() {
        super(boss1Data);

        this.combatData = boss1CombatData;
    }

    getCombatData(): BossCombatData {
        return this.combatData;
    }

    override advancePhase(): boolean {
        const advanced = super.advancePhase();

        if (!advanced) {
            return false;
        }

        if (this.getCurrentPhase() === 2) {
            this.setArmor(
                this.getArmor() +
                this.phaseTwoArmorBonus
            );
        }

        return true;
    }
}