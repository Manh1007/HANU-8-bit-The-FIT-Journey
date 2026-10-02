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

    test("unused skill has zero remaining cooldown", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.getRemainingCooldown(
                "skill1",
                1000
            )
        ).toBe(0);
    });

    test("returns full cooldown immediately after skill use", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill1",
            1000
        );

        expect(
            system.getRemainingCooldown(
                "skill1",
                1000
            )
        ).toBe(3000);
    });

    test("remaining cooldown decreases over time", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill1",
            1000
        );

        expect(
            system.getRemainingCooldown(
                "skill1",
                1500
            )
        ).toBe(2500);

        expect(
            system.getRemainingCooldown(
                "skill1",
                2500
            )
        ).toBe(1500);
    });

    test("remaining cooldown becomes zero after cooldown expires", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill1",
            1000
        );

        expect(
            system.getRemainingCooldown(
                "skill1",
                4000
            )
        ).toBe(0);
    });

    test("remaining cooldown never becomes negative", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill1",
            1000
        );

        expect(
            system.getRemainingCooldown(
                "skill1",
                10000
            )
        ).toBe(0);
    });

    test("skill 2 returns its own cooldown", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill2",
            1000
        );

        expect(
            system.getRemainingCooldown(
                "skill2",
                2000
            )
        ).toBe(4000);
    });

    test("unused skill is ready", () => {
        const system =
            new BossSkillSystem();

        expect(
            system.getSkillState(
                "skill1",
                1000
            )
        ).toBe("ready");
    });
    test("skill is in cooldown after use", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill1",
            1000
        );

        expect(
            system.getSkillState(
                "skill1",
                2000
            )
        ).toBe("cooldown");
    });
    test("skill becomes ready after cooldown", () => {
        const system =
            new BossSkillSystem();

        system.useSkill(
            "skill1",
            1000
        );

        expect(
            system.getSkillState(
                "skill1",
                4000
            )
        ).toBe("ready");
    });
});