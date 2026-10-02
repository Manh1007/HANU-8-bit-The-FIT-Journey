import { BossBase } from "../bosses/BossBase";
import type { BossCombatData } from "../bosses/BossCombatData";
import { BossCombatSystem } from "./BossCombatSystem";
import {
    BossSkillSystem,
    type BossSkillId,
} from "./BossSkillSystem";
import { BossSkillExecutor } from "./BossSkillExecutor";
import { DamageSystem } from "./DamageSystem";
import type { BossCombatResult } from "./BossCombatResult";

export class BossCombatController {
    private readonly boss: BossBase;

    private readonly combatSystem:
        BossCombatSystem;

    private readonly skillSystem:
        BossSkillSystem;

    private readonly skillExecutor:
        BossSkillExecutor;

    private readonly damageSystem:
        DamageSystem;

    constructor(
        boss: BossBase,
        combatSystem: BossCombatSystem,
        skillSystem: BossSkillSystem,
        damageSystem: DamageSystem,
        combatData: BossCombatData
    ) {
        this.boss = boss;
        this.combatSystem = combatSystem;
        this.skillSystem = skillSystem;
        this.damageSystem = damageSystem;

        this.skillExecutor =
            new BossSkillExecutor(
                boss,
                skillSystem,
                combatData
            );
    }

    executeNormalAttack(
        targetArmor: number
    ): BossCombatResult {
        const damage =
            this.combatSystem
                .calculateNormalDamage();

        const damageResult =
            this.damageSystem.calculateDamage(
                damage,
                targetArmor
            );

        return {
            success: true,
            skillResult: {
                success: true,
                skillId: "normal",
                damage,
                critical: false,
            },
            finalDamage:
                damageResult.finalDamage,
        };
    }

    executeSkill(
        skillId: BossSkillId,
        currentTime: number,
        randomValue: number,
        targetArmor: number
    ): BossCombatResult {
        const skillResult =
            this.skillExecutor.executeSkill(
                skillId,
                currentTime,
                randomValue
            );

        if (!skillResult.success) {
            return {
                success: false,
                skillResult,
                finalDamage: 0,
            };
        }

        const damageResult =
            this.damageSystem.calculateDamage(
                skillResult.damage,
                targetArmor
            );

        return {
            success: true,
            skillResult,
            finalDamage:
                damageResult.finalDamage,
        };
    }

    getBossAttack(): number {
        return this.combatSystem
            .calculateNormalDamage();
    }

    canUseSkill(
        skillId: BossSkillId,
        currentTime: number
    ): boolean {
        return this.skillSystem
            .canUseSkill(
                skillId,
                currentTime
            );
    }

    getBoss(): BossBase {
        return this.boss;
    }
}