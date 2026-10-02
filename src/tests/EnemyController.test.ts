import { describe, expect, test, beforeEach } from "vitest";
import {
    EnemyController,
    DEFAULT_ENEMY_CONFIG,
    type EnemyControllerConfig,
    type EnemyPosition,
} from "../systems/EnemyController";
import { EnemyManager } from "../systems/EnemyManager";
import { Enemy, type EnemyData } from "../entities/Enemy";

// ============================================================
// Helpers
// ============================================================

function makeController(
    overrides: Partial<EnemyData> = {},
    position: EnemyPosition = { x: 0, y: 0 },
    config: Partial<EnemyControllerConfig> = {}
): EnemyController {
    const enemy = new Enemy({
        id: "e1",
        name: "Test Enemy",
        maxHp: 100,
        attack: 10,
        armor: 0,
        ...overrides,
    });
    return new EnemyController(
        enemy,
        position,
        { ...DEFAULT_ENEMY_CONFIG, ...config }
    );
}

const FAR_PLAYER: EnemyPosition = { x: 9999, y: 9999 };
const CLOSE_PLAYER: EnemyPosition = { x: 50, y: 0 };  // within detectionRange=120
const ATTACK_PLAYER: EnemyPosition = { x: 30, y: 0 };  // within attackRange=40

// ============================================================
// EnemyController — initial state
// ============================================================

describe("EnemyController — initialization", () => {
    test("should start in idle state", () => {
        const ctrl = makeController();
        expect(ctrl.getState()).toBe("idle");
    });

    test("should start alive", () => {
        const ctrl = makeController();
        expect(ctrl.isAlive()).toBe(true);
        expect(ctrl.isDead()).toBe(false);
    });

    test("should report initial position", () => {
        const ctrl = makeController({}, { x: 10, y: 20 });
        const pos = ctrl.getPosition();
        expect(pos.x).toBe(10);
        expect(pos.y).toBe(20);
    });
});

// ============================================================
// EnemyController — idle & patrol
// ============================================================

describe("EnemyController — idle & patrol", () => {
    test("should stay idle with no player nearby", () => {
        const ctrl = makeController();
        // Default patrolInterval=2000; at t=0, 0-0=0 is NOT > 2000 → stays idle
        const result = ctrl.update(16, 0, null);
        expect(result.state).toBe("idle");
    });

    test("should transition to patrol after patrolInterval", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            patrolInterval: 100,
        });
        ctrl.update(16, 0, null);     // t=0: 0-0=0 NOT > 100 → idle
        ctrl.update(16, 101, null);   // t=101: 101-0=101 > 100 → patrol
        expect(ctrl.getState()).toBe("patrol");
    });

    test("should move horizontally while patrolling", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            patrolInterval: 1000,
            patrolSpeed: 100,
        });
        // t=1001: triggers patrol (1001-0=1001 >= 1000)
        ctrl.update(16, 1001, null);
        expect(ctrl.getState()).toBe("patrol");
        // t=1500: 499ms of movement (not enough time to flip at t=2001)
        ctrl.update(499, 1500, null);
        const pos = ctrl.getPosition();
        // Should have moved ~49.9 units
        expect(Math.abs(pos.x)).toBeGreaterThan(0);
    });

    test("velocity should be zero in idle state", () => {
        const ctrl = makeController();
        ctrl.update(16, 0, null);
        expect(ctrl.getVelocityX()).toBe(0);
        expect(ctrl.getVelocityY()).toBe(0);
    });
});

// ============================================================
// EnemyController — detection & chase
// ============================================================

describe("EnemyController — detection & chase", () => {
    test("should detect player within detection range", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            detectionRange: 120,
        });
        ctrl.update(16, 0, CLOSE_PLAYER); // player at x=50
        // After alert → immediately transitions to chase
        expect(ctrl.getState()).toBe("chase");
    });

    test("should not detect player outside detection range", () => {
        const ctrl = makeController();
        ctrl.update(16, 0, FAR_PLAYER);
        expect(ctrl.getState()).toBe("idle");
    });

    test("should chase player: velocity points toward player", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            detectionRange: 200,
            attackRange: 10, // keep small so we don't immediately attack
            chaseSpeed: 100,
        });
        // Force into chase by putting player within detection range
        ctrl.update(16, 0, CLOSE_PLAYER);
        // Now check velocity direction
        expect(ctrl.getVelocityX()).toBeGreaterThan(0); // moving right toward player
        expect(ctrl.getVelocityY()).toBe(0);
    });

    test("should stop chasing when player exceeds chaseDropRange", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            detectionRange: 200,
            chaseDropRange: 150,
            attackRange: 10,
        });
        // First get into chase state
        ctrl.update(16, 0, CLOSE_PLAYER);
        expect(ctrl.getState()).toBe("chase");

        // Now player is far away
        ctrl.update(16, 16, FAR_PLAYER);
        expect(ctrl.getState()).toBe("idle");
    });
});

// ============================================================
// EnemyController — attack
// ============================================================

describe("EnemyController — attack", () => {
    test("should attack player when in attack range", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            detectionRange: 200,
            attackRange: 40,
            attackCooldown: 0,
        });
        ctrl.update(16, 0, ATTACK_PLAYER); // player at x=30
        const result = ctrl.update(16, 16, ATTACK_PLAYER);
        expect(result.didAttack).toBe(true);
        expect(result.attackDamage).toBe(10); // enemy.attack = 10
    });

    test("should not attack when on cooldown", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            detectionRange: 200,
            attackRange: 40,
            attackCooldown: 2000,
        });
        // Get into attack state
        ctrl.update(16, 0, ATTACK_PLAYER);
        ctrl.update(16, 16, ATTACK_PLAYER); // first attack
        const result = ctrl.update(16, 32, ATTACK_PLAYER); // still on cooldown
        expect(result.didAttack).toBe(false);
    });

    test("should attack again after cooldown expires", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            detectionRange: 200,
            attackRange: 40,
            attackCooldown: 500,
        });
        ctrl.update(16, 0, ATTACK_PLAYER);
        ctrl.update(16, 16, ATTACK_PLAYER); // first attack at t=16
        // Fast-forward past cooldown
        const result = ctrl.update(16, 1000, ATTACK_PLAYER);
        expect(result.didAttack).toBe(true);
    });
});

// ============================================================
// EnemyController — take damage & hurt state
// ============================================================

describe("EnemyController — hurt & death", () => {
    test("should enter hurt state when taking non-lethal damage", () => {
        const ctrl = makeController({ maxHp: 100 });
        const ok = ctrl.takeDamage(30, 0);
        expect(ok).toBe(true);
        expect(ctrl.getState()).toBe("hurt");
        expect(ctrl.isAlive()).toBe(true);
    });

    test("should recover from hurt after hurtDuration", () => {
        const ctrl = makeController({}, { x: 0, y: 0 }, {
            hurtDuration: 100,
            detectionRange: 200,
        });
        ctrl.takeDamage(30, 0);
        expect(ctrl.getState()).toBe("hurt");

        // Update after hurt duration expires (no player → idle)
        ctrl.update(16, 200, null);
        expect(ctrl.getState()).toBe("idle");
    });

    test("should enter death state when HP reaches 0", () => {
        const ctrl = makeController({ maxHp: 50 });
        ctrl.takeDamage(50, 0);
        expect(ctrl.getState()).toBe("death");
        expect(ctrl.isDead()).toBe(true);
        expect(ctrl.isAlive()).toBe(false);
    });

    test("should not accept damage after death", () => {
        const ctrl = makeController({ maxHp: 50 });
        ctrl.takeDamage(50, 0);  // kill
        const result = ctrl.takeDamage(30, 100);
        expect(result).toBe(false);
        expect(ctrl.getEnemy().getHp()).toBe(0);
    });

    test("should stop moving after death", () => {
        const ctrl = makeController({ maxHp: 10 }, { x: 0, y: 0 }, {
            detectionRange: 200,
        });
        ctrl.update(16, 0, CLOSE_PLAYER); // chase
        ctrl.takeDamage(10, 16);          // kill
        ctrl.update(16, 32, CLOSE_PLAYER); // should stay dead
        expect(ctrl.getVelocityX()).toBe(0);
        expect(ctrl.getVelocityY()).toBe(0);
        expect(ctrl.getState()).toBe("death");
    });
});

// ============================================================
// EnemyManager
// ============================================================

describe("EnemyManager", () => {
    let manager: EnemyManager;

    beforeEach(() => {
        manager = new EnemyManager();
    });

    test("should start empty", () => {
        expect(manager.count()).toBe(0);
        expect(manager.aliveCount()).toBe(0);
    });

    test("should spawn an enemy", () => {
        manager.spawn(
            { id: "e1", name: "Enemy 1", maxHp: 100, attack: 10, armor: 0 },
            { x: 0, y: 0 }
        );
        expect(manager.count()).toBe(1);
        expect(manager.aliveCount()).toBe(1);
    });

    test("should get controller by ID", () => {
        manager.spawn(
            { id: "e1", name: "Enemy 1", maxHp: 100, attack: 10, armor: 0 },
            { x: 0, y: 0 }
        );
        const ctrl = manager.getController("e1");
        expect(ctrl).not.toBeUndefined();
        expect(ctrl!.getEnemy().getId()).toBe("e1");
    });

    test("should remove an enemy by ID", () => {
        manager.spawn(
            { id: "e1", name: "Enemy 1", maxHp: 100, attack: 10, armor: 0 },
            { x: 0, y: 0 }
        );
        const removed = manager.remove("e1");
        expect(removed).toBe(true);
        expect(manager.count()).toBe(0);
    });

    test("should remove dead enemies", () => {
        const ctrl = manager.spawn(
            { id: "e1", name: "Enemy 1", maxHp: 10, attack: 10, armor: 0 },
            { x: 0, y: 0 }
        );
        ctrl.takeDamage(10, 0); // kill
        expect(ctrl.isDead()).toBe(true);

        const removed = manager.removeDead();
        expect(removed).toContain("e1");
        expect(manager.count()).toBe(0);
    });

    test("should update all alive enemies", () => {
        manager.spawn(
            { id: "e1", name: "Enemy 1", maxHp: 100, attack: 10, armor: 0 },
            { x: 0, y: 0 }
        );
        manager.spawn(
            { id: "e2", name: "Enemy 2", maxHp: 100, attack: 10, armor: 0 },
            { x: 100, y: 0 }
        );

        const results = manager.updateAll(16, 0, null);
        expect(results.size).toBe(2);
    });

    test("should get nearest enemy to position", () => {
        manager.spawn(
            { id: "e1", name: "Far Enemy", maxHp: 100, attack: 10, armor: 0 },
            { x: 500, y: 0 }
        );
        manager.spawn(
            { id: "e2", name: "Near Enemy", maxHp: 100, attack: 10, armor: 0 },
            { x: 30, y: 0 }
        );

        const nearest = manager.getNearestTo({ x: 0, y: 0 });
        expect(nearest!.getEnemy().getId()).toBe("e2");
    });

    test("should get enemies in range", () => {
        manager.spawn(
            { id: "e1", name: "In Range", maxHp: 100, attack: 10, armor: 0 },
            { x: 50, y: 0 }
        );
        manager.spawn(
            { id: "e2", name: "Out of Range", maxHp: 100, attack: 10, armor: 0 },
            { x: 500, y: 0 }
        );

        const inRange = manager.getEnemiesInRange({ x: 0, y: 0 }, 100);
        expect(inRange).toHaveLength(1);
        expect(inRange[0].getEnemy().getId()).toBe("e1");
    });

    test("should clear all enemies", () => {
        manager.spawn(
            { id: "e1", name: "Enemy 1", maxHp: 100, attack: 10, armor: 0 },
            { x: 0, y: 0 }
        );
        manager.clear();
        expect(manager.count()).toBe(0);
    });
});

// ============================================================
// Full enemy gameplay loop
// ============================================================

describe("Full enemy gameplay loop", () => {
    test("enemy detects, chases, attacks, and can be killed", () => {
        const ctrl = makeController(
            { maxHp: 30, attack: 15, armor: 0 },
            { x: 0, y: 0 },
            {
                detectionRange: 200,
                attackRange: 40,
                chaseDropRange: 300,
                attackCooldown: 0,
                hurtDuration: 50,
            }
        );

        const playerPos: EnemyPosition = { x: 30, y: 0 };

        // t=0: should detect and eventually attack
        let result = ctrl.update(16, 0, playerPos);
        // First update goes idle→alert→chase; next update triggers attack
        expect(["alert", "chase", "attack"]).toContain(result.state);

        // t=16: should be in attack range and attack
        result = ctrl.update(16, 16, playerPos);
        expect(result.didAttack).toBe(true);
        expect(result.attackDamage).toBe(15);

        // Now player deals damage back
        ctrl.takeDamage(15, 32);
        expect(ctrl.getState()).toBe("hurt");

        ctrl.takeDamage(15, 200); // lethal
        expect(ctrl.isDead()).toBe(true);
        expect(ctrl.getState()).toBe("death");
    });
});
