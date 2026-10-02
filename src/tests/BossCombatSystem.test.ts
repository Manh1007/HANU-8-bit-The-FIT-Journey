import { describe, expect, test } from "vitest";

import { Boss1 } from "../bosses/Boss1";
import { BossCombatSystem } from "../systems/BossCombatSystem";

describe("BossCombatSystem", () => {
    test("should calculate normal attack damage", () => {
        const boss = new Boss1();

        const combatSystem =
            new BossCombatSystem(
                boss,
                boss.getCombatData()
            );

        expect(
            combatSystem.calculateNormalDamage()
        ).toBe(10);
    });

    test("should calculate critical attack damage", () => {
        const boss = new Boss1();

        const combatSystem =
            new BossCombatSystem(
                boss,
                boss.getCombatData()
            );

        expect(
            combatSystem.calculateCriticalDamage()
        ).toBe(17);
    });

    test("should calculate skill 1 damage", () => {
        const boss = new Boss1();

        const combatSystem =
            new BossCombatSystem(
                boss,
                boss.getCombatData()
            );

        expect(
            combatSystem.calculateSkillDamage("skill1")
        ).toBe(20);
    });

    test("should calculate skill 2 damage", () => {
        const boss = new Boss1();

        const combatSystem =
            new BossCombatSystem(
                boss,
                boss.getCombatData()
            );

        expect(
            combatSystem.calculateSkillDamage("skill2")
        ).toBe(35);
    });
});