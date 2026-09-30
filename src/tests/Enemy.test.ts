import { describe, expect, test } from "vitest";
import { Enemy, type EnemyData } from "../entities/Enemy";
import { DamageSystem } from "../systems/DamageSystem";

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

    test("should reduce HP when taking damage", () => {
        const enemy = new Enemy(enemyData);

        const actualDamage = enemy.takeDamage(20);

        expect(actualDamage).toBe(20);
        expect(enemy.getHp()).toBe(80);
        expect(enemy.isAlive()).toBe(true);
    });

    test("should not change HP when taking zero damage", () => {
        const enemy = new Enemy(enemyData);

        const actualDamage = enemy.takeDamage(0);

        expect(actualDamage).toBe(0);
        expect(enemy.getHp()).toBe(100);
        expect(enemy.isAlive()).toBe(true);
    });

    test("should not reduce HP with negative damage", () => {
        const enemy = new Enemy(enemyData);

        const actualDamage = enemy.takeDamage(-20);

        expect(actualDamage).toBe(0);
        expect(enemy.getHp()).toBe(100);
        expect(enemy.isAlive()).toBe(true);
    });

    test("should become dead when HP reaches zero", () => {
        const enemy = new Enemy(enemyData);

        const actualDamage = enemy.takeDamage(100);

        expect(actualDamage).toBe(100);
        expect(enemy.getHp()).toBe(0);
        expect(enemy.isAlive()).toBe(false);
    });

    test("should not allow HP to become negative", () => {
        const enemy = new Enemy(enemyData);

        const actualDamage = enemy.takeDamage(150);

        expect(actualDamage).toBe(100);
        expect(enemy.getHp()).toBe(0);
        expect(enemy.isAlive()).toBe(false);
    });

    test("should not take damage after death", () => {
        const enemy = new Enemy(enemyData);

        enemy.takeDamage(100);

        expect(enemy.getHp()).toBe(0);
        expect(enemy.isAlive()).toBe(false);

        const actualDamage = enemy.takeDamage(50);

        expect(actualDamage).toBe(0);
        expect(enemy.getHp()).toBe(0);
        expect(enemy.isAlive()).toBe(false);
    });

    test("should report alive state correctly", () => {
        const enemy = new Enemy(enemyData);

        expect(enemy.isAlive()).toBe(true);
        expect(enemy.isDead()).toBe(false);
    });

    test("should report dead state correctly", () => {
        const enemy = new Enemy(enemyData);

        enemy.takeDamage(100);

        expect(enemy.isAlive()).toBe(false);
        expect(enemy.isDead()).toBe(true);
    });

    test("should calculate HP percentage correctly", () => {
        const enemy = new Enemy(enemyData);

        expect(enemy.getHpPercentage()).toBe(1);

        enemy.takeDamage(25);

        expect(enemy.getHpPercentage()).toBe(0.75);

        enemy.takeDamage(50);

        expect(enemy.getHpPercentage()).toBe(0.25);
    });

    test("should report full health correctly", () => {
        const enemy = new Enemy(enemyData);

        expect(enemy.isFullHealth()).toBe(true);

        enemy.takeDamage(20);

        expect(enemy.isFullHealth()).toBe(false);
    });

    test("should return zero HP percentage when max HP is zero", () => {
        const enemy = new Enemy({
            ...enemyData,
            maxHp: 0,
        });

        expect(enemy.getHpPercentage()).toBe(0);
    });
});

describe("Enemy + DamageSystem", () => {
    test("should apply final damage calculated by DamageSystem", () => {
        const enemy = new Enemy({
            id: "test-enemy",
            name: "Test Enemy",
            maxHp: 100,
            attack: 10,
            armor: 5,
        });

        const damageSystem = new DamageSystem();

        const result = damageSystem.calculateDamage(
            30,
            enemy.getArmor()
        );

        const actualDamage = enemy.takeDamage(
            result.finalDamage
        );

        expect(result.finalDamage).toBe(17.5);
        expect(actualDamage).toBe(17.5);
        expect(enemy.getHp()).toBe(82.5);
        expect(enemy.isAlive()).toBe(true);
    });
});