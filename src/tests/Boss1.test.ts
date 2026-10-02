import { describe, expect, test } from "vitest";
import { Boss1 } from "../bosses/Boss1";

describe("Boss1", () => {
    test("should initialize correctly", () => {
        const boss = new Boss1();

        expect(boss.getId()).toBe("boss-1");
        expect(boss.getName()).toBe("Boss 1");

        expect(boss.getHp()).toBe(300);
        expect(boss.getMaxHp()).toBe(300);

        expect(boss.getAttack()).toBe(10);
        expect(boss.getArmor()).toBe(5);

        expect(boss.getCurrentPhase()).toBe(1);
        expect(boss.getMaxPhases()).toBe(2);

        expect(boss.getState()).toBe("idle");
    });

    test("should have correct phase configuration", () => {
        const boss = new Boss1();

        expect(
            boss.getPhaseConfig(1)
        ).toEqual({
            phase: 1,
            hpThreshold: 1,
        });

        expect(
            boss.getPhaseConfig(2)
        ).toEqual({
            phase: 2,
            hpThreshold: 0.5,
        });
    });

    test("should advance to phase 2 at 50 percent HP", () => {
        const boss = new Boss1();

        boss.startBattle();

        boss.takeDamage(150);

        expect(
            boss.getHpPercentage()
        ).toBe(0.5);

        expect(
            boss.updatePhase()
        ).toBe(true);

        expect(
            boss.getCurrentPhase()
        ).toBe(2);
    });

    test("should not advance to phase 3", () => {
        const boss = new Boss1();

        boss.startBattle();

        boss.takeDamage(150);

        expect(
            boss.updatePhase()
        ).toBe(true);

        expect(
            boss.getCurrentPhase()
        ).toBe(2);

        expect(
            boss.updatePhase()
        ).toBe(false);

        expect(
            boss.getCurrentPhase()
        ).toBe(2);
    });

    test("should gain 15 armor when entering phase 2", () => {
        const boss = new Boss1();

        expect(boss.getArmor()).toBe(5);

        boss.startBattle();
        boss.takeDamage(150);

        expect(boss.updatePhase()).toBe(true);

        expect(boss.getCurrentPhase()).toBe(2);
        expect(boss.getArmor()).toBe(20);
    });

    test("should not apply phase 2 armor bonus more than once", () => {
        const boss = new Boss1();

        boss.startBattle();
        boss.takeDamage(150);

        expect(boss.updatePhase()).toBe(true);
        expect(boss.getArmor()).toBe(20);

        expect(boss.updatePhase()).toBe(false);
        expect(boss.getArmor()).toBe(20);
    });

    test("should have correct combat data", () => {
        const boss = new Boss1();

        const combatData = boss.getCombatData();

        expect(combatData.criticalChance).toBe(0.4);

        expect(
            combatData.criticalDamageMultiplier
        ).toBe(1.7);

        expect(
            combatData.skill1Multiplier
        ).toBe(2.0);

        expect(
            combatData.skill2Multiplier
        ).toBe(3.5);
    });
});
