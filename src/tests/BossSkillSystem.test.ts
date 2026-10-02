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

    test("should have correct cooldown for skill 1", () => {
        const skillSystem =
            new BossSkillSystem();

        const skill =
            skillSystem.getSkill("skill1");

        expect(skill?.cooldown).toBe(3000);
    });

    test("should have correct cooldown for skill 2", () => {
        const skillSystem =
            new BossSkillSystem();

        const skill =
            skillSystem.getSkill("skill2");

        expect(skill?.cooldown).toBe(5000);
    });

    test("should allow skill to be used initially", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.canUseSkill(
                "skill1",
                1000
            )
        ).toBe(true);
    });

    test("should block skill during cooldown", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            skillSystem.canUseSkill(
                "skill1",
                2000
            )
        ).toBe(false);
    });

    test("should allow skill after cooldown", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            skillSystem.canUseSkill(
                "skill1",
                4000
            )
        ).toBe(true);
    });

    test("should keep cooldowns independent", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            skillSystem.canUseSkill(
                "skill1",
                2000
            )
        ).toBe(false);

        expect(
            skillSystem.canUseSkill(
                "skill2",
                2000
            )
        ).toBe(true);
    });

    test("should reject using a skill during its cooldown", () => {
        const skillSystem =
            new BossSkillSystem();

        expect(
            skillSystem.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            skillSystem.useSkill(
                "skill1",
                2000
            )
        ).toBe(false);
    });
});