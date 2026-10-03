import { describe, expect, test } from "vitest";
import { Boss2 } from "../bosses/Boss2";
import { BossCombatSystem } from "../systems/BossCombatSystem";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossCombatController } from "../systems/BossCombatController";
import { BossPhaseBehavior } from "../systems/BossPhaseBehavior";
import { DamageSystem } from "../systems/DamageSystem";
import { BossSkillExecutor } from "../systems/BossSkillExecutor";

describe("Boss 2", () => {
    function createCombatSystem(boss: Boss2): BossCombatSystem {
        const phaseBehavior = new BossPhaseBehavior(boss.getPhaseCombatData());
        return new BossCombatSystem(boss, boss.getCombatData(), phaseBehavior);
    }

    function createController(boss: Boss2): BossCombatController {
        const phaseBehavior = new BossPhaseBehavior(boss.getPhaseCombatData());
        const combatSystem = new BossCombatSystem(boss, boss.getCombatData(), phaseBehavior);
        const skillSystem = new BossSkillSystem(boss.getSkillData());
        const damageSystem = new DamageSystem();
        return new BossCombatController(
            boss,
            combatSystem,
            skillSystem,
            damageSystem,
            boss.getCombatData(),
            phaseBehavior
        );
    }

    describe("1. Initialization and Base Stats", () => {
        test("should initialize with exact specified base stats", () => {
            const boss = new Boss2();

            expect(boss.getId()).toBe("boss-2");
            expect(boss.getName()).toBe("Boss 2");
            expect(boss.getMaxHp()).toBe(500);
            expect(boss.getHp()).toBe(500);
            expect(boss.getAttack()).toBe(16);
            expect(boss.getArmor()).toBe(10);
            expect(boss.getMaxPhases()).toBe(2);
            expect(boss.getCurrentPhase()).toBe(1);
            expect(boss.getState()).toBe("idle");
            expect(boss.isAlive()).toBe(true);
            expect(boss.isDead()).toBe(false);
        });

        test("should have exact phase configuration", () => {
            const boss = new Boss2();

            expect(boss.getPhaseConfig(1)).toEqual({
                phase: 1,
                hpThreshold: 1.0,
            });

            expect(boss.getPhaseConfig(2)).toEqual({
                phase: 2,
                hpThreshold: 0.5,
            });
        });

        test("should have exact combat data", () => {
            const boss = new Boss2();
            const combatData = boss.getCombatData();

            expect(combatData.criticalChance).toBe(0.35);
            expect(combatData.criticalDamageMultiplier).toBe(1.8);
            expect(combatData.skill1Multiplier).toBe(2.0);
            expect(combatData.skill2Multiplier).toBe(3.5);
        });

        test("should have exact skill data definitions", () => {
            const boss = new Boss2();
            const skills = boss.getSkillData();

            expect(skills).toHaveLength(2);

            const skill1 = skills.find((s) => s.id === "skill1");
            expect(skill1).toBeDefined();
            expect(skill1?.damageMultiplier).toBe(2.0);
            expect(skill1?.cooldown).toBe(3000);

            const skill2 = skills.find((s) => s.id === "skill2");
            expect(skill2).toBeDefined();
            expect(skill2?.damageMultiplier).toBe(3.5);
            expect(skill2?.cooldown).toBe(5000);
        });
    });

    describe("2. Phase Transitions and Armor Bonus", () => {
        test("should not advance phase before 50% HP threshold", () => {
            const boss = new Boss2();
            boss.startBattle();

            // 500 - 240 = 260 HP (52% HP > 50%)
            boss.takeDamage(240);
            expect(boss.getHpPercentage()).toBe(0.52);

            expect(boss.updatePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(1);
            expect(boss.getArmor()).toBe(10);
        });

        test("should advance to phase 2 at exactly 50% HP and apply +20 armor", () => {
            const boss = new Boss2();
            boss.startBattle();

            // 500 - 250 = 250 HP (50% HP)
            boss.takeDamage(250);
            expect(boss.getHpPercentage()).toBe(0.5);

            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(2);

            // Base 10 + bonus 20 = 30
            expect(boss.getArmor()).toBe(30);
        });

        test("should advance to phase 2 below 50% HP and apply +20 armor", () => {
            const boss = new Boss2();
            boss.startBattle();

            boss.takeDamage(300); // 200 HP = 40%
            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(2);
            expect(boss.getArmor()).toBe(30);
        });

        test("should not apply phase 2 armor bonus more than once", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);

            expect(boss.updatePhase()).toBe(true);
            expect(boss.getArmor()).toBe(30);

            // Second update call
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(2);
            expect(boss.getArmor()).toBe(30);

            // Third update call after taking more damage
            boss.takeDamage(50);
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getArmor()).toBe(30);
        });

        test("should not advance beyond max phases (phase 2)", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);
            boss.updatePhase();

            expect(boss.getCurrentPhase()).toBe(2);
            expect(boss.canAdvancePhase()).toBe(false);
            expect(boss.advancePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(2);
        });
    });

    describe("3. Phase-Specific Combat and Damage Calculations", () => {
        test("Phase 1 normal attack: 16 * 1.0 = 16", () => {
            const boss = new Boss2();
            const cs = createCombatSystem(boss);

            expect(cs.calculateNormalDamage()).toBe(16);
        });

        test("Phase 2 normal attack: 16 * 1.3 = 20.8", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateNormalDamage()).toBeCloseTo(20.8);
        });

        test("Phase 1 Skill 1: 16 * 2.0 = 32", () => {
            const boss = new Boss2();
            const cs = createCombatSystem(boss);

            expect(cs.calculateSkillDamage("skill1")).toBe(32);
        });

        test("Phase 1 Skill 2: 16 * 3.5 = 56", () => {
            const boss = new Boss2();
            const cs = createCombatSystem(boss);

            expect(cs.calculateSkillDamage("skill2")).toBe(56);
        });

        test("Phase 2 Skill 1: 16 * 2.8 = 44.8", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateSkillDamage("skill1")).toBeCloseTo(44.8);
        });

        test("Phase 2 Skill 2: 16 * 4.5 = 72", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateSkillDamage("skill2")).toBe(72);
        });
    });

    describe("4. Critical Damage and Skills through BossSkillExecutor", () => {
        function createExecutor(boss: Boss2): {
            executor: BossSkillExecutor;
            skillSystem: BossSkillSystem;
        } {
            const phaseBehavior = new BossPhaseBehavior(boss.getPhaseCombatData());
            const skillSystem = new BossSkillSystem(boss.getSkillData());
            const executor = new BossSkillExecutor(
                boss,
                skillSystem,
                boss.getCombatData(),
                phaseBehavior
            );
            return { executor, skillSystem };
        }

        test("Phase 1 Skill 1 with non-critical: 32", () => {
            const boss = new Boss2();
            const { executor } = createExecutor(boss);

            const result = executor.executeSkill("skill1", 1000, 0.5);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(false);
            expect(result.damage).toBe(32);
        });

        test("Phase 1 Skill 1 with critical: 32 * 1.8 = 57.6", () => {
            const boss = new Boss2();
            const { executor } = createExecutor(boss);

            // randomValue 0.2 < criticalChance 0.35 -> critical
            const result = executor.executeSkill("skill1", 1000, 0.2);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(true);
            expect(result.damage).toBeCloseTo(57.6);
        });

        test("Phase 2 Skill 1 critical: 44.8 * 1.8 = 80.64", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);
            boss.updatePhase();

            const { executor } = createExecutor(boss);
            const result = executor.executeSkill("skill1", 1000, 0.1);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(true);
            expect(result.damage).toBeCloseTo(80.64);
        });

        test("Phase 2 Skill 2 critical: 72 * 1.8 = 129.6", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(250);
            boss.updatePhase();

            const { executor } = createExecutor(boss);
            const result = executor.executeSkill("skill2", 1000, 0.1);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(true);
            expect(result.damage).toBeCloseTo(129.6);
        });

        test("Skill 1 cooldown (3000 ms) and Skill 2 cooldown (5000 ms) are respected", () => {
            const boss = new Boss2();
            const { executor } = createExecutor(boss);

            // First cast of skill 1 at t=1000
            const hit1 = executor.executeSkill("skill1", 1000, 0.8);
            expect(hit1.success).toBe(true);

            // Try casting skill 1 at t=2500 (1500 ms elapsed < 3000 ms cooldown)
            const hit2 = executor.executeSkill("skill1", 2500, 0.8);
            expect(hit2.success).toBe(false);
            expect(hit2.damage).toBe(0);

            // Cast skill 2 at t=2500 (independent cooldown)
            const hitSkill2 = executor.executeSkill("skill2", 2500, 0.8);
            expect(hitSkill2.success).toBe(true);

            // Try casting skill 2 at t=4000 (1500 ms < 5000 ms)
            expect(executor.executeSkill("skill2", 4000, 0.8).success).toBe(false);

            // Skill 1 ready again at t=4000 (3000 ms elapsed since t=1000)
            const hit3 = executor.executeSkill("skill1", 4000, 0.8);
            expect(hit3.success).toBe(true);

            // Skill 2 ready again at t=7500 (5000 ms elapsed since t=2500)
            const hitSkill2Again = executor.executeSkill("skill2", 7500, 0.8);
            expect(hitSkill2Again.success).toBe(true);
        });
    });

    describe("5. BossCombatController Integration", () => {
        test("executes attacks and skills through BossCombatController with target armor", () => {
            const boss = new Boss2();
            const controller = createController(boss);

            expect(controller.startCombat()).toBe(true);
            expect(controller.isCombatActive()).toBe(true);

            // Phase 1 normal attack against target with 2 armor:
            // raw: 16, reduction: 2 * 2.5 = 5 -> finalDamage: 11
            const resNormal = controller.executeNormalAttack(2);
            expect(resNormal.success).toBe(true);
            expect(resNormal.finalDamage).toBe(11);

            // Phase 1 Skill 1 against target with 4 armor:
            // raw: 32, reduction: 4 * 2.5 = 10 -> finalDamage: 22
            const resSkill = controller.executeSkill("skill1", 1000, 0.8, 4);
            expect(resSkill.success).toBe(true);
            expect(resSkill.finalDamage).toBe(22);
        });

        test("updates phase in controller when boss HP reaches 50%", () => {
            const boss = new Boss2();
            const controller = createController(boss);
            controller.startCombat();

            boss.takeDamage(250);
            const phaseResult = controller.updateBossPhase();

            expect(phaseResult.changed).toBe(true);
            expect(phaseResult.previousPhase).toBe(1);
            expect(phaseResult.currentPhase).toBe(2);
            expect(boss.getArmor()).toBe(30);

            // Subsequent update check returns changed: false
            const phaseResult2 = controller.updateBossPhase();
            expect(phaseResult2.changed).toBe(false);
            expect(phaseResult2.currentPhase).toBe(2);
        });
    });

    describe("6. Defeat Behavior and Action Locking", () => {
        test("transitions to defeated state at 0 HP", () => {
            const boss = new Boss2();
            boss.startBattle();

            expect(boss.getState()).toBe("active");
            const actualDamage = boss.takeDamage(500);

            expect(actualDamage).toBe(500);
            expect(boss.getHp()).toBe(0);
            expect(boss.isDead()).toBe(true);
            expect(boss.getState()).toBe("defeated");
        });

        test("HP never becomes negative on overkill", () => {
            const boss = new Boss2();
            boss.startBattle();

            const actualDamage = boss.takeDamage(1000);
            expect(actualDamage).toBe(500);
            expect(boss.getHp()).toBe(0);
            expect(boss.getState()).toBe("defeated");
        });

        test("defeated boss cannot take further damage", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(500);

            const extraDamage = boss.takeDamage(100);
            expect(extraDamage).toBe(0);
            expect(boss.getHp()).toBe(0);
        });

        test("defeated boss cannot advance phase", () => {
            const boss = new Boss2();
            boss.startBattle();
            boss.takeDamage(500);

            expect(boss.canAdvancePhase()).toBe(false);
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(1);
        });

        test("defeated boss cannot attack through controller", () => {
            const boss = new Boss2();
            const controller = createController(boss);
            controller.startCombat();

            boss.takeDamage(500);

            const res = controller.executeNormalAttack(0);
            expect(res.success).toBe(false);
            expect(res.finalDamage).toBe(0);
        });

        test("defeated boss cannot execute skill or check skill availability", () => {
            const boss = new Boss2();
            const controller = createController(boss);
            controller.startCombat();

            boss.takeDamage(500);

            expect(controller.canUseSkill("skill1", 1000)).toBe(false);

            const res = controller.executeSkill("skill1", 1000, 0.8, 0);
            expect(res.success).toBe(false);
            expect(res.finalDamage).toBe(0);
        });

        test("defeated boss cannot start combat", () => {
            const boss = new Boss2();
            const controller = createController(boss);

            boss.takeDamage(500);
            expect(controller.startCombat()).toBe(false);
            expect(controller.isCombatActive()).toBe(false);
        });
    });
});
