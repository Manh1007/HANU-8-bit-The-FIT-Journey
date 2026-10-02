import {
    describe,
    expect,
    test,
} from "vitest";

import {
    BossSkillSystem,
} from "../systems/BossSkillSystem";

describe("BossSkillSystem", () => {
    test("should register skill 1", () => {
        const skillSystem =
            new BossSkillSystem();

        const skill =
            skillSystem.getSkill("skill1");

        expect(skill).toBeDefined();

        expect(skill?.id).toBe(
            "skill1"
        );

        expect(skill?.damageMultiplier).toBe(
            2.0
        );
    });

    test("should register skill 2", () => {
        const skillSystem =
            new BossSkillSystem();

        const skill =
            skillSystem.getSkill("skill2");

        expect(skill).toBeDefined();

        expect(skill?.id).toBe(
            "skill2"
        );

        expect(skill?.damageMultiplier).toBe(
            3.5
        );
    });

    test("should confirm registered skills", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.hasSkill("skill1")
        ).toBe(true);

        expect(
            skillSystem.hasSkill("skill2")
        ).toBe(true);
    });

    test("should correctly report skill availability", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.hasSkill("skill1")
        ).toBe(true);

        expect(
            skillSystem.hasSkill("skill2")
        ).toBe(true);
    });
});