import {
    describe,
    expect,
    test,
} from "vitest";

import {
    BossBase,
    type BossData,
} from "../bosses/BossBase";

class TestBoss extends BossBase {
    private phaseReady = false;

    constructor(data: BossData) {
        super(data);
    }

    setPhaseReady(value: boolean): void {
        this.phaseReady = value;
    }

    protected shouldAdvancePhase(): boolean {
        return this.phaseReady;
    }

    defeat(): void {
        this.markDefeated();
    }
}

const bossData: BossData = {
    id: "test-boss",
    name: "Test Boss",
    maxHp: 300,
    attack: 10,
    armor: 5,
    maxPhases: 3,
};

describe("BossBase", () => {
    test("should initialize correctly", () => {
        const boss = new TestBoss(bossData);

        expect(boss.getId()).toBe("test-boss");
        expect(boss.getName()).toBe("Test Boss");

        expect(boss.getMaxHp()).toBe(300);
        expect(boss.getHp()).toBe(300);

        expect(boss.getAttack()).toBe(10);
        expect(boss.getArmor()).toBe(5);

        expect(boss.getCurrentPhase()).toBe(1);
        expect(boss.getMaxPhases()).toBe(3);

        expect(boss.getState()).toBe("idle");
    });

    test("should start battle", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        expect(boss.getState()).toBe("active");
    });

    test("should advance boss phase", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        expect(boss.getCurrentPhase()).toBe(1);

        const firstAdvance = boss.advancePhase();

        expect(firstAdvance).toBe(true);
        expect(boss.getCurrentPhase()).toBe(2);

        const secondAdvance = boss.advancePhase();

        expect(secondAdvance).toBe(true);
        expect(boss.getCurrentPhase()).toBe(3);
    });

    test("should not advance beyond max phase", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        boss.advancePhase();
        boss.advancePhase();

        expect(boss.getCurrentPhase()).toBe(3);

        const result = boss.advancePhase();

        expect(result).toBe(false);
        expect(boss.getCurrentPhase()).toBe(3);
    });

    test("should not advance phase before battle starts", () => {
        const boss = new TestBoss(bossData);

        const result = boss.advancePhase();

        expect(result).toBe(false);
        expect(boss.getCurrentPhase()).toBe(1);
        expect(boss.getState()).toBe("idle");
    });

    test("should change to defeated state", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        expect(boss.getState()).toBe("active");

        boss.defeat();

        expect(boss.getState()).toBe("defeated");
    });

    test("should report that phase can advance", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();
        boss.setPhaseReady(true);

        expect(boss.canAdvancePhase()).toBe(true);
    });

    test("should not advance phase when condition is not met", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        expect(boss.updatePhase()).toBe(false);
        expect(boss.getCurrentPhase()).toBe(1);
    });

    test("should advance phase when condition is met", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();
        boss.setPhaseReady(true);

        expect(boss.updatePhase()).toBe(true);
        expect(boss.getCurrentPhase()).toBe(2);
    });

    test("should not advance phase before battle starts", () => {
        const boss = new TestBoss(bossData);

        boss.setPhaseReady(true);

        expect(boss.canAdvancePhase()).toBe(false);
        expect(boss.updatePhase()).toBe(false);
        expect(boss.getCurrentPhase()).toBe(1);
    });

    test("should not advance phase when boss is dead", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();
        boss.takeDamage(300);

        boss.setPhaseReady(true);

        expect(boss.isDead()).toBe(true);
        expect(boss.canAdvancePhase()).toBe(false);
        expect(boss.updatePhase()).toBe(false);
        expect(boss.getCurrentPhase()).toBe(1);
    });

    test("should become defeated when HP reaches zero", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        expect(boss.getState()).toBe("active");

        const actualDamage = boss.takeDamage(300);

        expect(actualDamage).toBe(300);
        expect(boss.getHp()).toBe(0);
        expect(boss.isDead()).toBe(true);
        expect(boss.getState()).toBe("defeated");
    });

    test("should not restart battle after being defeated", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();
        boss.takeDamage(300);

        expect(boss.getState()).toBe("defeated");

        boss.startBattle();

        expect(boss.getState()).toBe("defeated");
    });

    test("should not advance phase after being defeated", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();
        boss.takeDamage(300);

        boss.setPhaseReady(true);

        expect(boss.getState()).toBe("defeated");
        expect(boss.canAdvancePhase()).toBe(false);
        expect(boss.updatePhase()).toBe(false);
        expect(boss.getCurrentPhase()).toBe(1);
    });

    test("should handle overkill damage correctly", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();

        const actualDamage = boss.takeDamage(500);

        expect(actualDamage).toBe(300);
        expect(boss.getHp()).toBe(0);
        expect(boss.isDead()).toBe(true);
        expect(boss.getState()).toBe("defeated");
    });

    test("should not take damage after being defeated", () => {
        const boss = new TestBoss(bossData);

        boss.startBattle();
        boss.takeDamage(300);

        const actualDamage = boss.takeDamage(100);

        expect(actualDamage).toBe(0);
        expect(boss.getHp()).toBe(0);
        expect(boss.getState()).toBe("defeated");
    });
});