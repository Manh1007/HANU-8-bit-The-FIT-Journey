import { describe, expect, test } from "vitest";
import { Boss1 } from "../bosses/Boss1";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossSkillExecutor } from "../systems/BossSkillExecutor";

describe("BossSkillExecutor", () => {
    test("executes skill 1 and calculates damage", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const damage = executor.executeSkill(
            "skill1",
            1000
        );

        expect(damage).toBe(20);
    });

    test("executes skill 2 and calculates damage", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const damage = executor.executeSkill(
            "skill2",
            1000
        );

        expect(damage).toBe(35);
    });

    test("returns zero for skill during cooldown", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const firstDamage =
            executor.executeSkill(
                "skill1",
                1000
            );

        const secondDamage =
            executor.executeSkill(
                "skill1",
                2000
            );

        expect(firstDamage).toBe(20);
        expect(secondDamage).toBe(0);
    });

    test("allows skill after cooldown", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const firstDamage =
            executor.executeSkill(
                "skill1",
                1000
            );

        const secondDamage =
            executor.executeSkill(
                "skill1",
                4000
            );

        expect(firstDamage).toBe(20);
        expect(secondDamage).toBe(20);
    });

    test("skill cooldowns are independent", () => {
        const boss = new Boss1();
        const skillSystem = new BossSkillSystem();
        const executor = new BossSkillExecutor(
            boss,
            skillSystem
        );

        const skill1Damage =
            executor.executeSkill(
                "skill1",
                1000
            );

        const skill2Damage =
            executor.executeSkill(
                "skill2",
                1000
            );

        expect(skill1Damage).toBe(20);
        expect(skill2Damage).toBe(35);
    });
});