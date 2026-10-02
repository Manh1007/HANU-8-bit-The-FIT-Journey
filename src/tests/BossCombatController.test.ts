import {
    describe,
    expect,
    test,
} from "vitest";

import { Boss1 } from "../bosses/Boss1";
import {
    BossCombatSystem,
} from "../systems/BossCombatSystem";
import {
    BossSkillSystem,
} from "../systems/BossSkillSystem";
import {
    BossCombatController,
} from "../systems/BossCombatController";
import {
    DamageSystem,
} from "../systems/DamageSystem";

describe("BossCombatController", () => {
    function createController(): BossCombatController {
        const boss = new Boss1();

        const combatSystem =
            new BossCombatSystem(
                boss,
                boss.getCombatData()
            );

        const skillSystem =
            new BossSkillSystem();

        const damageSystem =
            new DamageSystem();

        return new BossCombatController(
            boss,
            combatSystem,
            skillSystem,
            damageSystem,
            boss.getCombatData()
        );
    }

    test("executes skill and returns final damage", () => {
        const controller =
            createController();

        const result =
            controller.executeSkill(
                "skill1",
                1000,
                0.8,
                0
            );

        expect(result.success).toBe(true);
        expect(
            result.skillResult.success
        ).toBe(true);

        expect(
            result.skillResult.skillId
        ).toBe("skill1");

        expect(
            result.skillResult.damage
        ).toBe(20);

        expect(
            result.finalDamage
        ).toBe(20);
    });

    test("applies target armor to skill damage", () => {
        const controller =
            createController();

        const result =
            controller.executeSkill(
                "skill1",
                1000,
                0.8,
                4
            );

        expect(result.success).toBe(true);

        expect(
            result.skillResult.damage
        ).toBe(20);

        expect(
            result.finalDamage
        ).toBe(10);
    });

    test("applies critical skill damage", () => {
        const controller =
            createController();

        const result =
            controller.executeSkill(
                "skill1",
                1000,
                0.2,
                0
            );

        expect(result.success).toBe(true);

        expect(
            result.skillResult.critical
        ).toBe(true);

        expect(
            result.skillResult.damage
        ).toBe(34);

        expect(
            result.finalDamage
        ).toBe(34);
    });

    test("applies armor after critical damage", () => {
        const controller =
            createController();

        const result =
            controller.executeSkill(
                "skill1",
                1000,
                0.2,
                4
            );

        expect(result.success).toBe(true);

        expect(
            result.skillResult.damage
        ).toBe(34);

        expect(
            result.finalDamage
        ).toBe(24);
    });

    test("returns failed result when skill is on cooldown", () => {
        const controller =
            createController();

        const firstResult =
            controller.executeSkill(
                "skill1",
                1000,
                0.8,
                0
            );

        const secondResult =
            controller.executeSkill(
                "skill1",
                2000,
                0.8,
                0
            );

        expect(
            firstResult.success
        ).toBe(true);

        expect(
            secondResult.success
        ).toBe(false);

        expect(
            secondResult.finalDamage
        ).toBe(0);
    });

    test("allows skill after cooldown", () => {
        const controller =
            createController();

        controller.executeSkill(
            "skill1",
            1000,
            0.8,
            0
        );

        const result =
            controller.executeSkill(
                "skill1",
                4000,
                0.8,
                0
            );

        expect(result.success).toBe(true);

        expect(
            result.finalDamage
        ).toBe(20);
    });

    test("returns boss attack from combat system", () => {
        const controller =
            createController();

        expect(
            controller.getBossAttack()
        ).toBe(10);
    });

    test("checks skill availability", () => {
        const controller =
            createController();

        expect(
            controller.canUseSkill(
                "skill1",
                1000
            )
        ).toBe(true);

        controller.executeSkill(
            "skill1",
            1000,
            0.8,
            0
        );

        expect(
            controller.canUseSkill(
                "skill1",
                2000
            )
        ).toBe(false);

        expect(
            controller.canUseSkill(
                "skill1",
                4000
            )
        ).toBe(true);
    });

    test("returns the controlled boss", () => {
        const controller =
            createController();

        const boss =
            controller.getBoss();

        expect(boss).toBeInstanceOf(
            Boss1
        );

        expect(
            boss.getName()
        ).toBe("Boss 1");
    });
});