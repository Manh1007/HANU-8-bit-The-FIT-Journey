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

    test("executes normal attack", () => {
        const controller =
            createController();

        const result =
            controller.executeNormalAttack(0);

        expect(result.success).toBe(true);

        expect(
            result.skillResult.success
        ).toBe(true);

        expect(
            result.skillResult.skillId
        ).toBe("normal");

        expect(
            result.skillResult.damage
        ).toBe(10);

        expect(
            result.skillResult.critical
        ).toBe(false);

        expect(
            result.finalDamage
        ).toBe(10);
    });

    test("applies target armor to normal attack", () => {
        const controller =
            createController();

        const result =
            controller.executeNormalAttack(2);

        expect(result.success).toBe(true);

        expect(
            result.skillResult.damage
        ).toBe(10);

        expect(
            result.finalDamage
        ).toBe(5);
    });

    test("normal attack damage does not use skill cooldown", () => {
        const controller =
            createController();

        const firstResult =
            controller.executeNormalAttack(0);

        const secondResult =
            controller.executeNormalAttack(0);

        expect(
            firstResult.success
        ).toBe(true);

        expect(
            secondResult.success
        ).toBe(true);

        expect(
            firstResult.finalDamage
        ).toBe(10);

        expect(
            secondResult.finalDamage
        ).toBe(10);
    });

    test("normal attack is not critical", () => {
        const controller =
            createController();

        const result =
            controller.executeNormalAttack(0);

        expect(
            result.skillResult.critical
        ).toBe(false);
    });

    test("normal attack respects target armor", () => {
        const controller =
            createController();

        const result =
            controller.executeNormalAttack(4);

        expect(
            result.finalDamage
        ).toBe(0);
    });
});