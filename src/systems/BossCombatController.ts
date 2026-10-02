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
import type { BossPhaseResult } from "./BossPhaseResult";

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

    startCombat(): boolean {
        if (this.boss.isDead()) {
            return false;
        }

        this.boss.startBattle();

        return this.isCombatActive();
    }

    isCombatActive(): boolean {
        return this.boss.getState() === "active";
    }

    updateBossPhase(): BossPhaseResult {
        const previousPhase =
            this.boss.getCurrentPhase();

        if (!this.isCombatActive()) {
            return {
                changed: false,
                previousPhase,
                currentPhase: previousPhase,
            };
        }

        const changed =
            this.boss.updatePhase();

        const currentPhase =
            this.boss.getCurrentPhase();

        return {
            changed,
            previousPhase,
            currentPhase,
        };
    }

    executeNormalAttack(
        targetArmor: number
    ): BossCombatResult {
        if (!this.isCombatActive()) {
            return {
                success: false,
                skillResult: {
                    success: false,
                    skillId: "normal",
                    damage: 0,
                    critical: false,
                },
                finalDamage: 0,
            };
        }

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
        if (!this.isCombatActive()) {
            return {
                success: false,
                skillResult: {
                    success: false,
                    skillId,
                    damage: 0,
                    critical: false,
                },
                finalDamage: 0,
            };
        }

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
        if (!this.isCombatActive()) {
            return false;
        }

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