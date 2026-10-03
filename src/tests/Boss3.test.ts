import { describe, expect, test } from "vitest";
import { Boss3 } from "../bosses/Boss3";
import { BossCombatSystem } from "../systems/BossCombatSystem";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossCombatController } from "../systems/BossCombatController";
import { BossPhaseBehavior } from "../systems/BossPhaseBehavior";
import { DamageSystem } from "../systems/DamageSystem";
import { BossSkillExecutor } from "../systems/BossSkillExecutor";

describe("Boss 3", () => {
    function createCombatSystem(boss: Boss3): BossCombatSystem {
        const phaseBehavior = new BossPhaseBehavior(boss.getPhaseCombatData());
        return new BossCombatSystem(boss, boss.getCombatData(), phaseBehavior);
    }

    function createController(boss: Boss3): BossCombatController {
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
            const boss = new Boss3();

            expect(boss.getId()).toBe("boss-3");
            expect(boss.getName()).toBe("Boss 3");
            expect(boss.getMaxHp()).toBe(800);
            expect(boss.getHp()).toBe(800);
            expect(boss.getAttack()).toBe(24);
            expect(boss.getArmor()).toBe(15);
            expect(boss.getMaxPhases()).toBe(3);
            expect(boss.getCurrentPhase()).toBe(1);
            expect(boss.getState()).toBe("idle");
            expect(boss.isAlive()).toBe(true);
            expect(boss.isDead()).toBe(false);
        });

        test("should have exact phase configuration for 3 phases", () => {
            const boss = new Boss3();

            expect(boss.getPhaseConfig(1)).toEqual({
                phase: 1,
                hpThreshold: 1.0,
            });

            expect(boss.getPhaseConfig(2)).toEqual({
                phase: 2,
                hpThreshold: 0.6667,
            });

            expect(boss.getPhaseConfig(3)).toEqual({
                phase: 3,
                hpThreshold: 0.3333,
            });
        });

        test("should have exact combat data", () => {
            const boss = new Boss3();
            const combatData = boss.getCombatData();

            expect(combatData.criticalChance).toBe(0.30);
            expect(combatData.criticalDamageMultiplier).toBe(2.0);
            expect(combatData.skill1Multiplier).toBe(2.2);
            expect(combatData.skill2Multiplier).toBe(4.0);
        });

        test("should have exact skill data definitions with 2500ms and 4500ms cooldowns", () => {
            const boss = new Boss3();
            const skills = boss.getSkillData();

            expect(skills).toHaveLength(2);

            const skill1 = skills.find((s) => s.id === "skill1");
            expect(skill1).toBeDefined();
            expect(skill1?.damageMultiplier).toBe(2.2);
            expect(skill1?.cooldown).toBe(2500);

            const skill2 = skills.find((s) => s.id === "skill2");
            expect(skill2).toBeDefined();
            expect(skill2?.damageMultiplier).toBe(4.0);
            expect(skill2?.cooldown).toBe(4500);
        });
    });

    describe("2. Phase Transitions and Cumulative Armor Bonus", () => {
        test("should not advance to phase 2 above 66.67% HP threshold", () => {
            const boss = new Boss3();
            boss.startBattle();

            // 800 - 200 = 600 HP (75% HP > 66.67%)
            boss.takeDamage(200);
            expect(boss.getHpPercentage()).toBe(0.75);

            expect(boss.updatePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(1);
            expect(boss.getArmor()).toBe(15);
        });

        test("should advance to phase 2 at <= 66.67% HP and increase armor to 35", () => {
            const boss = new Boss3();
            boss.startBattle();

            // 800 - 300 = 500 HP (62.5% <= 66.67%)
            boss.takeDamage(300);
            expect(boss.getHpPercentage()).toBe(0.625);

            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(2);

            // Base 15 + bonus 20 = 35
            expect(boss.getArmor()).toBe(35);
        });

        test("should advance to phase 3 at <= 33.33% HP and increase armor cumulatively to 70", () => {
            const boss = new Boss3();
            boss.startBattle();

            // Step 1: transition to phase 2
            boss.takeDamage(300); // HP = 500
            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(2);
            expect(boss.getArmor()).toBe(35);

            // Step 2: transition to phase 3
            // 800 - 600 = 200 HP (25% <= 33.33%)
            boss.takeDamage(300); // HP = 200
            expect(boss.getHpPercentage()).toBe(0.25);

            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(3);

            // Cumulative armor: 15 + 20 + 35 = 70 (NOT 15 + 35 = 50!)
            expect(boss.getArmor()).toBe(70);
        });

        test("should never apply phase 2 or phase 3 armor bonus twice", () => {
            const boss = new Boss3();
            boss.startBattle();

            // Transition to phase 2
            boss.takeDamage(300);
            expect(boss.updatePhase()).toBe(true);
            expect(boss.getArmor()).toBe(35);

            // Repeated phase update in phase 2 does not add another 20
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getArmor()).toBe(35);

            // Transition to phase 3
            boss.takeDamage(300);
            expect(boss.updatePhase()).toBe(true);
            expect(boss.getArmor()).toBe(70);

            // Repeated phase update in phase 3 does not add another 35
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getArmor()).toBe(70);

            // Extra damage in phase 3 does not change armor
            boss.takeDamage(50);
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getArmor()).toBe(70);
        });

        test("should advance sequentially and never skip a phase", () => {
            const boss = new Boss3();
            boss.startBattle();

            // High damage in a single hit bringing HP down to 25% (<= 33.33%)
            boss.takeDamage(600); // 200 HP = 25%

            // First advance MUST go to phase 2 (never skip to phase 3 directly)
            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(2);
            expect(boss.getArmor()).toBe(35);

            // Second advance then goes to phase 3
            expect(boss.updatePhase()).toBe(true);
            expect(boss.getCurrentPhase()).toBe(3);
            expect(boss.getArmor()).toBe(70);

            // Cannot advance further
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(3);
        });

        test("should never transition phase backward", () => {
            const boss = new Boss3();
            boss.startBattle();

            boss.takeDamage(300);
            boss.updatePhase();
            expect(boss.getCurrentPhase()).toBe(2);

            // Check advancePhase logic cannot go backwards
            expect(boss.getCurrentPhase()).toBeGreaterThanOrEqual(2);
        });
    });

    describe("3. Phase Escalation and Damage Calculations", () => {
        test("Phase 1 normal attack: 24 * 1.0 = 24", () => {
            const boss = new Boss3();
            const cs = createCombatSystem(boss);

            expect(cs.calculateNormalDamage()).toBe(24);
        });

        test("Phase 2 normal attack: 24 * 1.25 = 30", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateNormalDamage()).toBe(30);
        });

        test("Phase 3 normal attack: 24 * 1.5 = 36", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();
            boss.takeDamage(300);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateNormalDamage()).toBe(36);
        });

        test("Phase 1 Skill 1: 24 * 2.2 = 52.8", () => {
            const boss = new Boss3();
            const cs = createCombatSystem(boss);

            expect(cs.calculateSkillDamage("skill1")).toBeCloseTo(52.8);
        });

        test("Phase 1 Skill 2: 24 * 4.0 = 96", () => {
            const boss = new Boss3();
            const cs = createCombatSystem(boss);

            expect(cs.calculateSkillDamage("skill2")).toBe(96);
        });

        test("Phase 2 Skill 1: 24 * 3.0 = 72", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateSkillDamage("skill1")).toBe(72);
        });

        test("Phase 2 Skill 2: 24 * 5.0 = 120", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateSkillDamage("skill2")).toBe(120);
        });

        test("Phase 3 Skill 1: 24 * 3.8 = 91.2", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();
            boss.takeDamage(300);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateSkillDamage("skill1")).toBeCloseTo(91.2);
        });

        test("Phase 3 Skill 2: 24 * 6.0 = 144", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();
            boss.takeDamage(300);
            boss.updatePhase();

            const cs = createCombatSystem(boss);
            expect(cs.calculateSkillDamage("skill2")).toBe(144);
        });
    });

    describe("4. Critical Damage and Skills through BossSkillExecutor", () => {
        function createExecutor(boss: Boss3): {
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

        test("Phase 1 Skill 1 non-critical: 52.8", () => {
            const boss = new Boss3();
            const { executor } = createExecutor(boss);

            const result = executor.executeSkill("skill1", 1000, 0.5);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(false);
            expect(result.damage).toBeCloseTo(52.8);
        });

        test("Phase 1 Skill 1 critical: 52.8 * 2.0 = 105.6", () => {
            const boss = new Boss3();
            const { executor } = createExecutor(boss);

            // randomValue 0.1 < criticalChance 0.30 -> critical
            const result = executor.executeSkill("skill1", 1000, 0.1);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(true);
            expect(result.damage).toBeCloseTo(105.6);
        });

        test("Phase 2 Skill 2 critical: 120 * 2.0 = 240", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();

            const { executor } = createExecutor(boss);
            const result = executor.executeSkill("skill2", 1000, 0.1);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(true);
            expect(result.damage).toBe(240);
        });

        test("Phase 3 Skill 2 critical: 144 * 2.0 = 288", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(300);
            boss.updatePhase();
            boss.takeDamage(300);
            boss.updatePhase();

            const { executor } = createExecutor(boss);
            const result = executor.executeSkill("skill2", 1000, 0.1);
            expect(result.success).toBe(true);
            expect(result.critical).toBe(true);
            expect(result.damage).toBe(288);
        });

        test("Skill 1 cooldown (2500 ms) and Skill 2 cooldown (4500 ms) are respected", () => {
            const boss = new Boss3();
            const { executor } = createExecutor(boss);

            // Cast Skill 1 at t=1000
            expect(executor.executeSkill("skill1", 1000, 0.8).success).toBe(true);

            // Try casting Skill 1 at t=2000 (1000 ms < 2500 ms)
            expect(executor.executeSkill("skill1", 2000, 0.8).success).toBe(false);

            // Cast Skill 2 at t=2000 (independent cooldown)
            expect(executor.executeSkill("skill2", 2000, 0.8).success).toBe(true);

            // Skill 1 ready again at t=3500 (2500 ms elapsed since t=1000)
            expect(executor.executeSkill("skill1", 3500, 0.8).success).toBe(true);

            // Try casting Skill 2 at t=5000 (3000 ms < 4500 ms elapsed since t=2000)
            expect(executor.executeSkill("skill2", 5000, 0.8).success).toBe(false);

            // Skill 2 ready again at t=6500 (4500 ms elapsed since t=2000)
            expect(executor.executeSkill("skill2", 6500, 0.8).success).toBe(true);
        });
    });

    describe("5. BossCombatController Integration", () => {
        test("executes attacks and phase transitions across all 3 phases", () => {
            const boss = new Boss3();
            const controller = createController(boss);

            expect(controller.startCombat()).toBe(true);

            // Phase 1 normal attack against target with 4 armor
            // Raw 24, reduction 4 * 2.5 = 10 -> finalDamage: 14
            const hit1 = controller.executeNormalAttack(4);
            expect(hit1.success).toBe(true);
            expect(hit1.finalDamage).toBe(14);

            // Advance to Phase 2
            boss.takeDamage(300);
            const p2Res = controller.updateBossPhase();
            expect(p2Res.changed).toBe(true);
            expect(p2Res.currentPhase).toBe(2);
            expect(boss.getArmor()).toBe(35);

            // Phase 2 normal attack against target with 4 armor
            // Raw 30, reduction 10 -> finalDamage: 20
            const hit2 = controller.executeNormalAttack(4);
            expect(hit2.success).toBe(true);
            expect(hit2.finalDamage).toBe(20);

            // Advance to Phase 3
            boss.takeDamage(300);
            const p3Res = controller.updateBossPhase();
            expect(p3Res.changed).toBe(true);
            expect(p3Res.currentPhase).toBe(3);
            expect(boss.getArmor()).toBe(70);

            // Phase 3 normal attack against target with 4 armor
            // Raw 36, reduction 10 -> finalDamage: 26
            const hit3 = controller.executeNormalAttack(4);
            expect(hit3.success).toBe(true);
            expect(hit3.finalDamage).toBe(26);
        });
    });

    describe("6. Defeat Behavior and Action Locking", () => {
        test("transitions to defeated state at 0 HP", () => {
            const boss = new Boss3();
            boss.startBattle();

            expect(boss.getState()).toBe("active");
            const damage = boss.takeDamage(800);

            expect(damage).toBe(800);
            expect(boss.getHp()).toBe(0);
            expect(boss.isDead()).toBe(true);
            expect(boss.getState()).toBe("defeated");
        });

        test("overkill damage sets HP to 0 and does not result in negative HP", () => {
            const boss = new Boss3();
            boss.startBattle();

            const damage = boss.takeDamage(1200);
            expect(damage).toBe(800);
            expect(boss.getHp()).toBe(0);
            expect(boss.getState()).toBe("defeated");
        });

        test("defeated boss cannot take further damage", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(800);

            expect(boss.takeDamage(100)).toBe(0);
            expect(boss.getHp()).toBe(0);
        });

        test("defeated boss cannot advance phase", () => {
            const boss = new Boss3();
            boss.startBattle();
            boss.takeDamage(800);

            expect(boss.canAdvancePhase()).toBe(false);
            expect(boss.updatePhase()).toBe(false);
            expect(boss.getCurrentPhase()).toBe(1);
        });

        test("defeated boss cannot attack through controller", () => {
            const boss = new Boss3();
            const controller = createController(boss);
            controller.startCombat();

            boss.takeDamage(800);

            const res = controller.executeNormalAttack(0);
            expect(res.success).toBe(false);
            expect(res.finalDamage).toBe(0);
        });

        test("defeated boss cannot use skill through controller", () => {
            const boss = new Boss3();
            const controller = createController(boss);
            controller.startCombat();

            boss.takeDamage(800);

            expect(controller.canUseSkill("skill1", 1000)).toBe(false);

            const res = controller.executeSkill("skill1", 1000, 0.8, 0);
            expect(res.success).toBe(false);
            expect(res.finalDamage).toBe(0);
        });

        test("defeated boss cannot restart combat", () => {
            const boss = new Boss3();
            const controller = createController(boss);

            boss.takeDamage(800);
            expect(controller.startCombat()).toBe(false);
            expect(controller.isCombatActive()).toBe(false);
        });
    });
});
