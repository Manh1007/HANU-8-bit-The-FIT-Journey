import { describe, expect, test } from "vitest";
import { BossRegistry } from "../bosses/BossRegistry";
import { Boss1 } from "../bosses/Boss1";
import { Boss2 } from "../bosses/Boss2";
import { Boss3 } from "../bosses/Boss3";
import { BossCombatController } from "../systems/BossCombatController";

describe("BossRegistry", () => {
    test("registers boss-1, boss-2, and boss-3", () => {
        const ids = BossRegistry.getBossIds();

        expect(ids).toContain("boss-1");
        expect(ids).toContain("boss-2");
        expect(ids).toContain("boss-3");
        expect(ids).toHaveLength(3);

        expect(BossRegistry.hasBoss("boss-1")).toBe(true);
        expect(BossRegistry.hasBoss("boss-2")).toBe(true);
        expect(BossRegistry.hasBoss("boss-3")).toBe(true);
        expect(BossRegistry.hasBoss("boss-999")).toBe(false);
    });

    test("createBoss creates correct instance for each ID", () => {
        const boss1 = BossRegistry.createBoss("boss-1");
        expect(boss1).toBeInstanceOf(Boss1);
        expect(boss1.getId()).toBe("boss-1");
        expect(boss1.getMaxHp()).toBe(300);
        expect(boss1.getAttack()).toBe(10);
        expect(boss1.getArmor()).toBe(5);

        const boss2 = BossRegistry.createBoss("boss-2");
        expect(boss2).toBeInstanceOf(Boss2);
        expect(boss2.getId()).toBe("boss-2");
        expect(boss2.getMaxHp()).toBe(500);
        expect(boss2.getAttack()).toBe(16);
        expect(boss2.getArmor()).toBe(10);

        const boss3 = BossRegistry.createBoss("boss-3");
        expect(boss3).toBeInstanceOf(Boss3);
        expect(boss3.getId()).toBe("boss-3");
        expect(boss3.getMaxHp()).toBe(800);
        expect(boss3.getAttack()).toBe(24);
        expect(boss3.getArmor()).toBe(15);
    });

    test("createBoss throws on unknown boss ID", () => {
        expect(() => BossRegistry.createBoss("unknown-boss")).toThrow(
            "Unknown boss id: unknown-boss"
        );
    });

    test("createCombatController builds working controller for Boss 1", () => {
        const controller = BossRegistry.createCombatController("boss-1");
        expect(controller).toBeInstanceOf(BossCombatController);
        expect(controller.getBoss()).toBeInstanceOf(Boss1);

        expect(controller.startCombat()).toBe(true);
        const result = controller.executeNormalAttack(0);
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBe(10);
    });

    test("createCombatController builds working controller for Boss 2", () => {
        const controller = BossRegistry.createCombatController("boss-2");
        expect(controller).toBeInstanceOf(BossCombatController);
        expect(controller.getBoss()).toBeInstanceOf(Boss2);

        expect(controller.startCombat()).toBe(true);
        const result = controller.executeNormalAttack(0);
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBe(16);
    });

    test("createCombatController builds working controller for Boss 3", () => {
        const controller = BossRegistry.createCombatController("boss-3");
        expect(controller).toBeInstanceOf(BossCombatController);
        expect(controller.getBoss()).toBeInstanceOf(Boss3);

        expect(controller.startCombat()).toBe(true);
        const result = controller.executeNormalAttack(0);
        expect(result.success).toBe(true);
        expect(result.finalDamage).toBe(24);
    });

    test("createCombatController throws on unknown ID", () => {
        expect(() => BossRegistry.createCombatController("non-existent")).toThrow(
            "Unknown boss id: non-existent"
        );
    });
});
