import { describe, expect, test, beforeEach } from "vitest";
import { PlayerStats } from "../systems/PlayerStats";
import { PlayerCombat } from "../systems/PlayerCombat";
import { WeaponSystem } from "../systems/WeaponSystem";
import { DamageSystem } from "../systems/DamageSystem";
import { CombatManager } from "../systems/CombatManager";
import { Enemy, type EnemyData } from "../entities/Enemy";
import { Boss1 } from "../bosses/Boss1";

// ============================================================
// Test helpers
// ============================================================

function makePlayerCombat(overrideStats?: Partial<{
    hp: number;
    armor: number;
    attack: number;
}>) {
    const stats = new PlayerStats();
    const weapon = new WeaponSystem();
    const damageSystem = new DamageSystem();

    // Apply overrides via upgrade path (limited) or just test with defaults
    if (overrideStats?.attack) {
        for (let i = 0; i < overrideStats.attack; i++) {
            stats.upgradeAttack();
        }
    }

    const combat = new PlayerCombat(stats, weapon, damageSystem);
    return { stats, weapon, damageSystem, combat };
}

function makeEnemy(overrides: Partial<EnemyData> = {}): Enemy {
    return new Enemy({
        id: "test-enemy",
        name: "Test Enemy",
        maxHp: 100,
        attack: 10,
        armor: 0,
        ...overrides,
    });
}

// ============================================================
// PlayerStats — combat state
// ============================================================

describe("PlayerStats — combat state", () => {
    test("should start alive", () => {
        const stats = new PlayerStats();
        expect(stats.isAlive()).toBe(true);
        expect(stats.isDead()).toBe(false);
    });

    test("should die when HP reaches 0", () => {
        const stats = new PlayerStats();
        stats.takeDamage(100);
        expect(stats.isDead()).toBe(true);
        expect(stats.isAlive()).toBe(false);
    });

    test("should be full health at start", () => {
        const stats = new PlayerStats();
        expect(stats.isFullHealth()).toBe(true);
    });

    test("should not be full health after damage", () => {
        const stats = new PlayerStats();
        stats.takeDamage(10);
        expect(stats.isFullHealth()).toBe(false);
    });
});

// ============================================================
// PlayerCombat — attack cooldown
// ============================================================

describe("PlayerCombat — attack cooldown", () => {
    test("should allow attack when cooldown has passed", () => {
        const { combat } = makePlayerCombat();
        // First attack at t=0
        expect(combat.attack(0)).toBe(true);
    });

    test("should block attack during cooldown", () => {
        const { combat } = makePlayerCombat();
        combat.attack(0);
        // Weapon cooldown is 400ms — 100ms later should be blocked
        expect(combat.attack(100)).toBe(false);
    });

    test("should allow attack after cooldown expires", () => {
        const { combat } = makePlayerCombat();
        combat.attack(0);
        // 400ms later — cooldown passed
        expect(combat.attack(400)).toBe(true);
    });

    test("canAttack should reflect cooldown state", () => {
        const { combat } = makePlayerCombat();
        expect(combat.canAttack(0)).toBe(true);
        combat.attack(0);
        expect(combat.canAttack(100)).toBe(false);
        expect(combat.canAttack(400)).toBe(true);
    });
});

// ============================================================
// PlayerCombat — attackTarget (Player → Enemy)
// ============================================================

describe("PlayerCombat — attackTarget", () => {
    test("should deal damage to enemy", () => {
        const { combat } = makePlayerCombat();
        const enemy = makeEnemy({ armor: 0 });

        // Weapon baseDamage = 5, enemy armor = 0 → final = 5
        const result = combat.attackTarget(enemy);

        expect(result.success).toBe(true);
        expect(result.rawDamage).toBe(5);
        expect(result.finalDamage).toBe(5);
        expect(enemy.getHp()).toBe(95);
    });

    test("should apply armor reduction when attacking enemy with armor", () => {
        const { combat } = makePlayerCombat();
        const enemy = makeEnemy({ armor: 1 });

        // weapon damage = 5, armor = 1 → reduction = 2.5 → final = 2.5
        const result = combat.attackTarget(enemy);

        expect(result.rawDamage).toBe(5);
        expect(result.finalDamage).toBe(2.5);
        expect(enemy.getHp()).toBe(97.5);
    });

    test("should kill enemy when damage exceeds HP", () => {
        const { combat } = makePlayerCombat();
        const enemy = makeEnemy({ maxHp: 3, armor: 0 });

        const result = combat.attackTarget(enemy);

        expect(result.killedTarget).toBe(true);
        expect(enemy.isDead()).toBe(true);
    });

    test("should not kill enemy when damage is insufficient", () => {
        const { combat } = makePlayerCombat();
        const enemy = makeEnemy({ maxHp: 100, armor: 0 });

        const result = combat.attackTarget(enemy);

        expect(result.killedTarget).toBe(false);
        expect(enemy.isAlive()).toBe(true);
    });

    test("should deal damage to Boss (Boss extends Enemy)", () => {
        const { combat } = makePlayerCombat();
        const boss = new Boss1();

        const initialHp = boss.getHp();
        const result = combat.attackTarget(boss);

        expect(result.success).toBe(true);
        // Boss armor = 5 → reduction = 12.5 → weapon 5 - 12.5 → 0 (capped)
        expect(result.finalDamage).toBe(0);
        expect(boss.getHp()).toBe(initialHp);
    });
});

// ============================================================
// PlayerCombat — receiveDamage (Enemy → Player)
// ============================================================

describe("PlayerCombat — receiveDamage", () => {
    test("should reduce player HP when attacked", () => {
        const { stats, combat } = makePlayerCombat();

        // Player armor = 10 → reduction = 25 → incoming 30 - 25 = 5
        const result = combat.receiveDamage(30);

        expect(result.incomingDamage).toBe(30);
        expect(result.finalDamage).toBe(5);
        expect(stats.getHp()).toBe(95);
    });

    test("should kill player when damage is lethal", () => {
        const { stats, combat } = makePlayerCombat();

        // Player has 100 HP, armor = 10 (reduction 25)
        // incoming 200 → final 175 → player dead
        const result = combat.receiveDamage(200);

        expect(result.playerDied).toBe(true);
        expect(stats.isDead()).toBe(true);
    });

    test("should deal zero damage when player armor absorbs all", () => {
        const { stats, combat } = makePlayerCombat();

        // armor = 10 → reduction = 25 → incoming 10 → final 0
        const result = combat.receiveDamage(10);

        expect(result.finalDamage).toBe(0);
        expect(stats.getHp()).toBe(100);
    });
});

// ============================================================
// CombatManager — state transitions
// ============================================================

describe("CombatManager — state", () => {
    let stats: PlayerStats;
    let combat: PlayerCombat;
    let manager: CombatManager;

    beforeEach(() => {
        const c = makePlayerCombat();
        stats = c.stats;
        combat = c.combat;
        manager = new CombatManager(combat, stats);
    });

    test("should start in idle state", () => {
        expect(manager.getState()).toBe("idle");
        expect(manager.isInCombat()).toBe(false);
    });

    test("should engage target and enter engaging state", () => {
        const enemy = makeEnemy();
        const result = manager.engageTarget(enemy);

        expect(result).toBe(true);
        expect(manager.getState()).toBe("engaging");
        expect(manager.isInCombat()).toBe(true);
        expect(manager.getActiveTarget()).toBe(enemy);
    });

    test("should not engage dead enemy", () => {
        const enemy = makeEnemy({ maxHp: 1 });
        enemy.takeDamage(1);

        const result = manager.engageTarget(enemy);
        expect(result).toBe(false);
        expect(manager.getState()).toBe("idle");
    });

    test("should disengage and return to idle", () => {
        const enemy = makeEnemy();
        manager.engageTarget(enemy);
        manager.disengage();

        expect(manager.getState()).toBe("idle");
        expect(manager.getActiveTarget()).toBeNull();
    });
});

// ============================================================
// CombatManager — Player attacks Enemy
// ============================================================

describe("CombatManager — player attacks enemy", () => {
    let stats: PlayerStats;
    let combat: PlayerCombat;
    let manager: CombatManager;

    beforeEach(() => {
        const c = makePlayerCombat();
        stats = c.stats;
        combat = c.combat;
        manager = new CombatManager(combat, stats);
    });

    test("should attack enemy and deal damage", () => {
        const enemy = makeEnemy({ armor: 0 });
        manager.engageTarget(enemy);

        const result = manager.playerAttack(0);

        expect(result).not.toBeNull();
        expect(result!.success).toBe(true);
        expect(enemy.getHp()).toBe(95); // 100 - 5 weapon damage
    });

    test("should return null when no target", () => {
        const result = manager.playerAttack(0);
        expect(result).toBeNull();
    });

    test("should return null during attack cooldown", () => {
        const enemy = makeEnemy({ armor: 0 });
        manager.engageTarget(enemy);

        manager.playerAttack(0);
        const result = manager.playerAttack(100); // still in cooldown

        expect(result).toBeNull();
    });

    test("should transition to enemy_dead when kill shot lands", () => {
        const enemy = makeEnemy({ maxHp: 5, armor: 0 });
        manager.engageTarget(enemy);

        manager.playerAttack(0);

        expect(manager.getState()).toBe("enemy_dead");
        expect(manager.getActiveTarget()).toBeNull();
    });

    test("should stay engaging after non-lethal attack", () => {
        const enemy = makeEnemy({ maxHp: 1000, armor: 0 });
        manager.engageTarget(enemy);

        manager.playerAttack(0);

        expect(manager.getState()).toBe("engaging");
    });
});

// ============================================================
// CombatManager — Enemy attacks Player
// ============================================================

describe("CombatManager — enemy attacks player", () => {
    let stats: PlayerStats;
    let combat: PlayerCombat;
    let manager: CombatManager;

    beforeEach(() => {
        const c = makePlayerCombat();
        stats = c.stats;
        combat = c.combat;
        manager = new CombatManager(combat, stats);
    });

    test("should reduce player HP when enemy attacks", () => {
        const enemy = makeEnemy({ attack: 30 });

        // player armor = 10 → reduction = 25 → incoming 30 → final 5
        const finalDamage = manager.enemyAttacksPlayer(enemy);

        expect(finalDamage).toBe(5);
        expect(stats.getHp()).toBe(95);
    });

    test("should transition to player_dead when killed", () => {
        const enemy = makeEnemy({ attack: 999 });

        manager.enemyAttacksPlayer(enemy);

        expect(manager.getState()).toBe("player_dead");
        expect(stats.isDead()).toBe(true);
    });

    test("should transition to hit state when player survives", () => {
        const enemy = makeEnemy({ attack: 30 });

        manager.enemyAttacksPlayer(enemy);

        expect(manager.getState()).toBe("hit");
    });

    test("should deal zero damage when enemy attack is fully absorbed", () => {
        const enemy = makeEnemy({ attack: 5 });
        // player armor = 10 → reduction = 25 → incoming 5 → final 0

        const finalDamage = manager.enemyAttacksPlayer(enemy);

        expect(finalDamage).toBe(0);
        expect(stats.getHp()).toBe(100);
    });
});

// ============================================================
// CombatManager — range detection
// ============================================================

describe("CombatManager — range detection", () => {
    test("should detect target in attack range", () => {
        const { stats, combat } = makePlayerCombat();
        const manager = new CombatManager(combat, stats);

        // Weapon attackRange = 40
        const inRange = manager.isInAttackRange(0, 0, 30, 0);
        expect(inRange).toBe(true);
    });

    test("should not detect target out of attack range", () => {
        const { stats, combat } = makePlayerCombat();
        const manager = new CombatManager(combat, stats);

        const outOfRange = manager.isInAttackRange(0, 0, 100, 0);
        expect(outOfRange).toBe(false);
    });

    test("should detect target exactly at attack range boundary", () => {
        const { stats, combat } = makePlayerCombat();
        const manager = new CombatManager(combat, stats);

        // Exactly at range = 40
        const atBoundary = manager.isInAttackRange(0, 0, 40, 0);
        expect(atBoundary).toBe(true);
    });
});

// ============================================================
// Full combat loop
// ============================================================

describe("Full combat loop — Player vs Enemy", () => {
    test("player should be able to kill enemy over multiple attacks", () => {
        const c = makePlayerCombat();
        const manager = new CombatManager(c.combat, c.stats);
        const enemy = makeEnemy({ maxHp: 20, armor: 0 });

        manager.engageTarget(enemy);

        let t = 0;
        let attackCount = 0;
        const maxAttacks = 20;

        while (enemy.isAlive() && attackCount < maxAttacks) {
            manager.playerAttack(t);
            t += 400; // advance past cooldown
            attackCount++;
        }

        expect(enemy.isDead()).toBe(true);
        // weapon damage = 5, enemy hp = 20 → needs 4 hits
        expect(attackCount).toBeLessThanOrEqual(5);
    });

    test("enemy should be able to kill player with repeated attacks", () => {
        const c = makePlayerCombat();
        const manager = new CombatManager(c.combat, c.stats);
        // High attack enemy that bypasses armor (attack = 200 → final = 175)
        const enemy = makeEnemy({ attack: 200 });

        manager.enemyAttacksPlayer(enemy);

        expect(c.stats.isDead()).toBe(true);
        expect(manager.getState()).toBe("player_dead");
    });
});
