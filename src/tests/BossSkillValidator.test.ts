import { describe, expect, test } from "vitest";
import {
    BossSkillValidator,
} from "../systems/BossSkillValidator";
import type {
    BossSkillData,
} from "../systems/BossSkillSystem";

describe("BossSkillValidator", () => {
    const validator =
        new BossSkillValidator();

    test("accepts valid skill data", () => {
        const skill: BossSkillData = {
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 2.0,
            cooldown: 3000,
        };

        expect(
            validator.validate(skill)
        ).toBe(true);
    });

    test("rejects zero damage multiplier", () => {
        const skill: BossSkillData = {
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 0,
            cooldown: 3000,
        };

        expect(
            validator.validate(skill)
        ).toBe(false);
    });

    test("rejects negative damage multiplier", () => {
        const skill: BossSkillData = {
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: -1,
            cooldown: 3000,
        };

        expect(
            validator.validate(skill)
        ).toBe(false);
    });

    test("accepts zero cooldown", () => {
        const skill: BossSkillData = {
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 2.0,
            cooldown: 0,
        };

        expect(
            validator.validate(skill)
        ).toBe(true);
    });

    test("rejects negative cooldown", () => {
        const skill: BossSkillData = {
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 2.0,
            cooldown: -100,
        };

        expect(
            validator.validate(skill)
        ).toBe(false);
    });

    test("accepts current skill 1 configuration", () => {
        const skill: BossSkillData = {
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 2.0,
            cooldown: 3000,
        };

        expect(
            validator.validate(skill)
        ).toBe(true);
    });

    test("accepts current skill 2 configuration", () => {
        const skill: BossSkillData = {
            id: "skill2",
            name: "Skill 2",
            damageMultiplier: 3.5,
            cooldown: 5000,
        };

        expect(
            validator.validate(skill)
        ).toBe(true);
    });
});