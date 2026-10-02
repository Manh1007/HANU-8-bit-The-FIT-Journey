import {
    describe,
    expect,
    test,
} from "vitest";

import {
    BossSkillSystem,
} from "../systems/BossSkillSystem";

describe("BossSkillSystem", () => {
    test("skill 1 has correct definition", () => {
        const system =
            new BossSkillSystem();

        const skill =
            system.getSkill("skill1");

        expect(skill).toBeDefined();
        expect(skill?.id).toBe("skill1");
        expect(skill?.name).toBe("Skill 1");
        expect(
            skill?.damageMultiplier
        ).toBe(2.0);
        expect(
            skill?.cooldown
        ).toBe(3000);
    });

    test("skill 2 has correct definition", () => {
        const system =
            new BossSkillSystem();

        const skill =
            system.getSkill("skill2");

        expect(skill).toBeDefined();
        expect(skill?.id).toBe("skill2");
        expect(skill?.name).toBe("Skill 2");
        expect(
            skill?.damageMultiplier
        ).toBe(3.5);
        expect(
            skill?.cooldown
        ).toBe(5000);
    });

    test("registered skills are available", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.hasSkill("skill1")
        ).toBe(true);

        expect(
            system.hasSkill("skill2")
        ).toBe(true);
    });

    test("unregistered skill is unavailable", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.hasSkill("skill1")
        ).toBe(true);

        expect(
            system.hasSkill("skill2")
        ).toBe(true);
    });

    test("skill 1 is initially available", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.canUseSkill(
                "skill1",
                1000
            )
        ).toBe(true);
    });

    test("skill 1 is unavailable during cooldown", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            system.canUseSkill(
                "skill1",
                2000
            )
        ).toBe(false);
    });

    test("skill 1 becomes available after cooldown", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            system.canUseSkill(
                "skill1",
                4000
            )
        ).toBe(true);
    });

    test("skill 2 has independent cooldown", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            system.canUseSkill(
                "skill2",
                1000
            )
        ).toBe(true);
    });

    test("skill cannot be used twice during cooldown", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            system.useSkill(
                "skill1",
                2000
            )
        ).toBe(false);
    });

    test("skill can be used again after cooldown", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.useSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        expect(
            system.useSkill(
                "skill1",
                4000
            )
        ).toBe(true);
    });
});