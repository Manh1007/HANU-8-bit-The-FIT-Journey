import { describe, expect, test } from "vitest";
import { DamageSystem } from "../systems/DamageSystem";
import { PlayerStats } from "../systems/PlayerStats";

describe("DamageSystem", () => {
    test("should calculate damage after armor reduction", () => {
        const damageSystem = new DamageSystem();

        const result = damageSystem.calculateDamage(
            40,
            10
        );

        expect(result.incomingDamage).toBe(40);
        expect(result.armor).toBe(10);
        expect(result.damageReduction).toBe(25);
        expect(result.finalDamage).toBe(15);
    });

    test("should not allow final damage to be negative", () => {
        const damageSystem = new DamageSystem();

        const result = damageSystem.calculateDamage(
            20,
            10
        );

        expect(result.finalDamage).toBe(0);
    });

    test("should handle zero armor", () => {
        const damageSystem = new DamageSystem();

        const result = damageSystem.calculateDamage(
            100,
            0
        );

        expect(result.finalDamage).toBe(100);
    });

    test("should not allow negative incoming damage", () => {
        const damageSystem = new DamageSystem();

        const result = damageSystem.calculateDamage(
            -50,
            10
        );

        expect(result.incomingDamage).toBe(0);
        expect(result.finalDamage).toBe(0);
    });
});

describe("PlayerStats damage", () => {
    test("should reduce player HP", () => {
        const stats = new PlayerStats();

        const actualDamage = stats.takeDamage(20);

        expect(actualDamage).toBe(20);
        expect(stats.getHp()).toBe(80);
    });

    test("should not allow HP to become negative", () => {
        const stats = new PlayerStats();

        const actualDamage = stats.takeDamage(150);

        expect(actualDamage).toBe(100);
        expect(stats.getHp()).toBe(0);
    });

    test("should not reduce HP when damage is negative", () => {
        const stats = new PlayerStats();

        const actualDamage = stats.takeDamage(-20);

        expect(actualDamage).toBe(0);
        expect(stats.getHp()).toBe(100);
    });
});

describe("DamageSystem + PlayerStats", () => {
    test("should calculate final damage and apply it to player HP", () => {
        const stats = new PlayerStats();
        const damageSystem = new DamageSystem();

        const result = damageSystem.calculateDamage(
            40,
            stats.getArmor()
        );

        const actualDamage = stats.takeDamage(
            result.finalDamage
        );

        expect(result.finalDamage).toBe(15);
        expect(actualDamage).toBe(15);
        expect(stats.getHp()).toBe(85);
    });
});