import { describe, expect, test, beforeEach } from "vitest";
import { Boss1 } from "../bosses/Boss1";
import { BossCombatSystem } from "../systems/BossCombatSystem";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossCombatController } from "../systems/BossCombatController";
import { BossPhaseBehavior } from "../systems/BossPhaseBehavior";
import { DamageSystem } from "../systems/DamageSystem";
import { PlayerCombat } from "../systems/PlayerCombat";
import { PlayerStats } from "../systems/PlayerStats";
import { WeaponSystem } from "../systems/WeaponSystem";
import {
    type AcademicChallengeData,
    BossEncounter,
} from "../systems/AcademicChallenge";
import { GameState } from "../systems/GameState";

describe("Phase A21 — Boss / Academic Challenge Gameplay", () => {
    function createTestBossController(): BossCombatController {
        const boss = new Boss1(); // maxHp: 300, phase 2 at hp <= 50% (150)
        const phaseBehavior = new BossPhaseBehavior([
            {
                phase: 1,
                attackMultiplier: 1,
                armorBonus: 0,
                skill1Multiplier: 2,
                skill2Multiplier: 3.5,
            },
            {
                phase: 2,
                attackMultiplier: 1.2,
                armorBonus: 15,
                skill1Multiplier: 2.5,
                skill2Multiplier: 4,
            },
        ]);
        const combatSystem = new BossCombatSystem(
            boss,
            boss.getCombatData(),
            phaseBehavior
        );
        const skillSystem = new BossSkillSystem();
        const damageSystem = new DamageSystem();

        return new BossCombatController(
            boss,
            combatSystem,
            skillSystem,
            damageSystem,
            boss.getCombatData(),
            phaseBehavior
        );
    }

    function createPlayer(attack = 50, _hp = 200, armor = 1) {
        const stats = new PlayerStats();
        stats.setArmor(armor);
        const weapon = new WeaponSystem();
        weapon.registerWeapon({
            id: "laptop",
            name: "Laptop Lập trình",
            baseDamage: attack,
            attackRange: 60,
            attackCooldown: 400,
        });
        weapon.equipWeapon("laptop");
        const damageSystem = new DamageSystem();
        const combat = new PlayerCombat(stats, weapon, damageSystem);
        return { stats, weapon, combat };
    }

    const testChallenge: AcademicChallengeData = {
        id: "challenge_cs101",
        title: "Thi kết thúc học phần: Lập trình C",
        subject: "Nhập môn Lập trình",
        description: "Vượt qua thử thách lập trình để hoàn thành học phần",
        bossId: "boss-1",
        locationId: "location_nha_c",
        requiredQuestId: "q_main_02",
        rewardMemoryIds: ["mem_programming_01"],
        unlockQuestId: "q_main_03",
        unlockLocationId: "location_library",
    };

    beforeEach(() => {
        GameState.reset();
    });

    test("should initialize boss encounter and start battle", () => {
        const bossController = createTestBossController();
        const player = createPlayer();

        const encounter = new BossEncounter(
            testChallenge,
            bossController,
            player.combat,
            player.stats
        );

        expect(encounter.getState()).toBe("idle");
        const started = encounter.start();
        expect(started).toBe(true);
        expect(encounter.getState()).toBe("in_progress");
        expect(bossController.isCombatActive()).toBe(true);
    });

    test("player attacks boss and advances boss phase when HP crosses threshold", () => {
        const bossController = createTestBossController();
        // High damage weapon so player takes boss down across phases
        const player = createPlayer(100);

        const encounter = new BossEncounter(
            testChallenge,
            bossController,
            player.combat,
            player.stats
        );
        encounter.start();

        const boss = bossController.getBoss();
        expect(boss.getCurrentPhase()).toBe(1);

        // Turn 1 at t=0
        const hit1 = encounter.playerAttack(0);
        expect(hit1.attackResult?.success).toBe(true);
        expect(boss.getHp()).toBeLessThan(300);

        // Turn 2 at t=600 (cooldown is 500ms)
        const hit2 = encounter.playerAttack(600);
        expect(hit2.attackResult?.success).toBe(true);

        // Turn 3 at t=1200: boss HP drops below 150 (50% threshold)
        const hit3 = encounter.playerAttack(1200);
        expect(hit3.attackResult?.success).toBe(true);
        expect(boss.getHp()).toBeLessThanOrEqual(150);
        expect(hit3.bossCurrentPhase).toBe(2);
        expect(boss.getCurrentPhase()).toBe(2);
    });

    test("boss attacks player and player takes calculated damage", () => {
        const bossController = createTestBossController();
        const player = createPlayer(20, 200);

        const encounter = new BossEncounter(
            testChallenge,
            bossController,
            player.combat,
            player.stats
        );
        encounter.start();

        const initialHp = player.stats.getHp();
        const result = encounter.bossAction(0);

        expect(result.combatResult.success).toBe(true);
        expect(result.combatResult.finalDamage).toBeGreaterThan(0);
        expect(player.stats.getHp()).toBe(initialHp - result.combatResult.finalDamage);
        expect(result.playerDied).toBe(false);
    });

    test("boss defeat completes challenge and triggers victory callback", () => {
        const bossController = createTestBossController();
        // Very high damage to defeat boss quickly
        const player = createPlayer(350);

        let won = false;
        const encounter = new BossEncounter(
            testChallenge,
            bossController,
            player.combat,
            player.stats,
            (challenge) => {
                expect(challenge.id).toBe("challenge_cs101");
                won = true;
            }
        );
        encounter.start();

        const hit = encounter.playerAttack(0);
        expect(hit.bossDefeated).toBe(true);
        expect(encounter.getState()).toBe("player_won");
        expect(encounter.isPlayerWon()).toBe(true);
        expect(encounter.isOver()).toBe(true);
        expect(won).toBe(true);
    });

    test("AcademicChallengeManager registers and launches challenge with GameState integration", () => {
        const gs = GameState.getInstance();
        const player = createPlayer(350);

        // Register memory and locations in GameState
        gs.memoryManager.registerMemory({
            id: "mem_programming_01",
            title: "Kỷ niệm Lập trình C",
            description: "",
            category: "milestone",
            hint: "",
        });

        gs.worldManager.loadLocations([
            { id: "location_nha_c", name: "Nhà C", description: "", sceneKey: "SceneC", connectedFrom: [] },
            { id: "location_library", name: "Thư viện", description: "", sceneKey: "SceneLib", connectedFrom: ["location_nha_c"] },
        ]);

        gs.questManager.loadQuests([
            {
                id: "q_main_02",
                type: "main",
                title: "Thử thách Nhà C",
                description: "",
                objectives: [
                    { id: "obj_boss", description: "Đánh bại Boss", type: "defeat_enemy", targetId: "boss-1", required: 1, current: 0 },
                ],
                rewards: [],
                prerequisites: [],
            },
            {
                id: "q_main_03",
                type: "main",
                title: "Khám phá Thư viện",
                description: "",
                objectives: [],
                rewards: [],
                prerequisites: ["q_main_02"],
            },
        ]);
        gs.questManager.startQuest("q_main_02");

        // Register challenge in manager
        gs.challengeManager.registerChallenge(testChallenge, () => createTestBossController());

        // Start encounter
        const encounter = gs.challengeManager.startChallenge(
            "challenge_cs101",
            player.combat,
            player.stats
        );
        expect(encounter).not.toBeNull();
        expect(gs.challengeManager.getActiveEncounter()).toBe(encounter);

        // Player attacks and defeats the boss
        const attackRes = encounter!.playerAttack(0);
        expect(attackRes.bossDefeated).toBe(true);

        // GameState should automatically receive events:
        // 1. Defeat enemy event updates quest objective
        expect(gs.questManager.getQuest("q_main_02")?.isCompleted()).toBe(true);

        // 2. Reward memory collected
        expect(gs.memoryManager.isCollected("mem_programming_01")).toBe(true);

        // 3. Next location unlocked
        expect(gs.worldManager.isUnlocked("location_library")).toBe(true);

        // 4. Follow-up quest unlocked and active
        expect(gs.questManager.getQuest("q_main_03")?.isActive()).toBe(true);

        // 5. Challenge marked completed in manager
        expect(gs.challengeManager.isChallengeCompleted("challenge_cs101")).toBe(true);
    });
});
