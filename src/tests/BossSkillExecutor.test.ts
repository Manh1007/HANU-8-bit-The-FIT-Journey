import { describe, expect, test } from "vitest";
import { Boss1 } from "../bosses/Boss1";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossSkillExecutor } from "../systems/BossSkillExecutor";

describe("BossSkillExecutor", () => {
    test("executes skill 1 and returns skill result", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const result =
            executor.executeSkill(
                "skill1",
                1000
            );

        expect(result.success).toBe(true);
        expect(result.skillId).toBe("skill1");
        expect(result.damage).toBe(20);
    });

    test("executes skill 2 and returns skill result", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const result =
            executor.executeSkill(
                "skill2",
                1000
            );

        expect(result.success).toBe(true);
        expect(result.skillId).toBe("skill2");
        expect(result.damage).toBe(35);
    });

    test("returns failed result when skill is on cooldown", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const firstResult =
            executor.executeSkill(
                "skill1",
                1000
            );

        const secondResult =
            executor.executeSkill(
                "skill1",
                2000
            );

        expect(firstResult.success).toBe(true);
        expect(firstResult.damage).toBe(20);

        expect(secondResult.success).toBe(false);
        expect(secondResult.skillId).toBe("skill1");
        expect(secondResult.damage).toBe(0);
    });

    test("allows skill execution after cooldown", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const firstResult =
            executor.executeSkill(
                "skill1",
                1000
            );

        const secondResult =
            executor.executeSkill(
                "skill1",
                4000
            );

        expect(firstResult.success).toBe(true);
        expect(firstResult.damage).toBe(20);

        expect(secondResult.success).toBe(true);
        expect(secondResult.damage).toBe(20);
    });

    test("skill cooldowns remain independent", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const skill1Result =
            executor.executeSkill(
                "skill1",
                1000
            );

        const skill2Result =
            executor.executeSkill(
                "skill2",
                1000
            );

        expect(skill1Result.success).toBe(true);
        expect(skill1Result.damage).toBe(20);

        expect(skill2Result.success).toBe(true);
        expect(skill2Result.damage).toBe(35);
    });
});