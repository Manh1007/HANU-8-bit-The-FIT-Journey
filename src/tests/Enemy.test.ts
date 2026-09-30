import { describe, expect, test } from "vitest";
import { Enemy, type EnemyData } from "../entities/Enemy";

describe("Enemy", () => {
    const enemyData: EnemyData = {
        id: "test-enemy",
        name: "Test Enemy",
        maxHp: 100,
        attack: 10,
        armor: 5,
    };

    test("should initialize with correct data", () => {
        const enemy = new Enemy(enemyData);

        expect(enemy.getId()).toBe("test-enemy");
        expect(enemy.getName()).toBe("Test Enemy");
        expect(enemy.getMaxHp()).toBe(100);
        expect(enemy.getHp()).toBe(100);
        expect(enemy.getAttack()).toBe(10);
        expect(enemy.getArmor()).toBe(5);
    });

    test("should start alive", () => {
        const enemy = new Enemy(enemyData);

        expect(enemy.isAlive()).toBe(true);
    });

    test("should start with HP equal to max HP", () => {
        const enemy = new Enemy(enemyData);

        expect(enemy.getHp()).toBe(
            enemy.getMaxHp()
        );
    });

    test("should be dead when max HP is zero", () => {
        const enemy = new Enemy({
            ...enemyData,
            maxHp: 0,
        });

        expect(enemy.getHp()).toBe(0);
        expect(enemy.isAlive()).toBe(false);
    });

    test("should not allow negative stats", () => {
        const enemy = new Enemy({
            ...enemyData,
            maxHp: -100,
            attack: -10,
            armor: -5,
        });

        expect(enemy.getMaxHp()).toBe(0);
        expect(enemy.getHp()).toBe(0);
        expect(enemy.getAttack()).toBe(0);
        expect(enemy.getArmor()).toBe(0);
        expect(enemy.isAlive()).toBe(false);
    });
});