import { describe, expect, test, beforeEach } from "vitest";
import { GameState } from "../systems/GameState";
import { PlayerStats } from "../systems/PlayerStats";
import { PlayerCombat } from "../systems/PlayerCombat";
import { WeaponSystem } from "../systems/WeaponSystem";
import { DamageSystem } from "../systems/DamageSystem";
import { BossRegistry } from "../bosses/BossRegistry";
import { Boss1 } from "../bosses/Boss1";
import { Boss2 } from "../bosses/Boss2";
import { Boss3 } from "../bosses/Boss3";
import type { AcademicChallengeData } from "../systems/AcademicChallenge";
import type { QuestData } from "../systems/QuestTypes";

describe("Final Boss Progression — End-to-End Gameplay Flow", () => {
    function createPlayer(attack = 100, _hp = 500, armor = 2) {
        const stats = new PlayerStats();
        stats.setArmor(armor);
        const weapon = new WeaponSystem();
        weapon.registerWeapon({
            id: "sword_fit",
            name: "FIT Hero Sword",
            baseDamage: attack,
            attackRange: 60,
            attackCooldown: 200,
        });
        weapon.equipWeapon("sword_fit");
        const damageSystem = new DamageSystem();
        const combat = new PlayerCombat(stats, weapon, damageSystem);
        return { stats, weapon, combat, damageSystem };
    }

    beforeEach(() => {
        GameState.reset();
    });

    test("Complete Linear Flow: Boss 1 -> Unlock Boss 2 -> Boss 2 -> Unlock Boss 3 -> Boss 3 -> Final Reward", () => {
        const gs = GameState.getInstance();
        const player = createPlayer(120, 1000, 5);

        // 1. Setup Quests matching the progression
        const quests: QuestData[] = [
            {
                id: "q_boss_1",
                type: "main",
                title: "Thử Thách Boss 1",
                description: "Hạ gục Boss 1 để mở khóa Boss 2",
                objectives: [
                    {
                        id: "obj_defeat_boss_1",
                        description: "Đánh bại Boss 1",
                        type: "defeat_enemy",
                        targetId: "boss-1",
                        required: 1,
                        current: 0,
                    },
                ],
                rewards: [
                    { type: "memory", value: "mem_boss_1_reward" },
                    { type: "unlock_quest", value: "q_boss_2" },
                ],
                prerequisites: [],
            },
            {
                id: "q_boss_2",
                type: "main",
                title: "Thử Thách Boss 2",
                description: "Hạ gục Boss 2 để mở khóa Boss 3",
                objectives: [
                    {
                        id: "obj_defeat_boss_2",
                        description: "Đánh bại Boss 2",
                        type: "defeat_enemy",
                        targetId: "boss-2",
                        required: 1,
                        current: 0,
                    },
                ],
                rewards: [
                    { type: "memory", value: "mem_boss_2_reward" },
                    { type: "unlock_quest", value: "q_boss_3" },
                ],
                prerequisites: ["q_boss_1"],
            },
            {
                id: "q_boss_3",
                type: "main",
                title: "Thử Thách Final Boss",
                description: "Hạ gục Boss 3 để hoàn thành hành trình FIT",
                objectives: [
                    {
                        id: "obj_defeat_boss_3",
                        description: "Đánh bại Boss 3",
                        type: "defeat_enemy",
                        targetId: "boss-3",
                        required: 1,
                        current: 0,
                    },
                ],
                rewards: [
                    { type: "memory", value: "mem_boss_3_graduation" },
                ],
                prerequisites: ["q_boss_2"],
            },
        ];
        gs.questManager.loadQuests(quests);
        gs.questManager.startQuest("q_boss_1");

        // Register Memories
        gs.memoryManager.registerMemory({ id: "mem_boss_1_reward", title: "Kỷ niệm Boss 1", description: "", category: "milestone", hint: "" });
        gs.memoryManager.registerMemory({ id: "mem_boss_2_reward", title: "Kỷ niệm Boss 2", description: "", category: "milestone", hint: "" });
        gs.memoryManager.registerMemory({ id: "mem_boss_3_graduation", title: "Lễ Tốt Nghiệp", description: "", category: "milestone", hint: "" });

        // Setup Challenges using BossRegistry
        const challenge1: AcademicChallengeData = {
            id: "challenge_boss_1",
            title: "Boss 1 Challenge",
            subject: "CS101",
            description: "",
            bossId: "boss-1",
            locationId: "loc_1",
            requiredQuestId: "q_boss_1",
            rewardMemoryIds: ["mem_boss_1_reward"],
            unlockQuestId: "q_boss_2",
        };
        const challenge2: AcademicChallengeData = {
            id: "challenge_boss_2",
            title: "Boss 2 Challenge",
            subject: "DSA",
            description: "",
            bossId: "boss-2",
            locationId: "loc_2",
            requiredQuestId: "q_boss_2",
            rewardMemoryIds: ["mem_boss_2_reward"],
            unlockQuestId: "q_boss_3",
        };
        const challenge3: AcademicChallengeData = {
            id: "challenge_boss_3",
            title: "Boss 3 Final Challenge",
            subject: "Graduation",
            description: "",
            bossId: "boss-3",
            locationId: "loc_3",
            requiredQuestId: "q_boss_3",
            rewardMemoryIds: ["mem_boss_3_graduation"],
        };

        gs.challengeManager.registerChallenge(challenge1, () => BossRegistry.createCombatController("boss-1"));
        gs.challengeManager.registerChallenge(challenge2, () => BossRegistry.createCombatController("boss-2"));
        gs.challengeManager.registerChallenge(challenge3, () => BossRegistry.createCombatController("boss-3"));

        // =====================================================================
        // STEP 1: VERIFY INITIAL PROGRESSION STATE
        // =====================================================================
        expect(gs.bossProgression.isBossUnlocked("boss-1")).toBe(true);
        expect(gs.bossProgression.isBossUnlocked("boss-2")).toBe(false);
        expect(gs.bossProgression.isBossUnlocked("boss-3")).toBe(false);
        expect(gs.bossProgression.canEncounterBoss("boss-2")).toBe(false);
        expect(gs.bossProgression.canEncounterBoss("boss-3")).toBe(false);

        // =====================================================================
        // STEP 2: FIGHT & DEFEAT BOSS 1
        // =====================================================================
        const encounter1 = gs.challengeManager.startChallenge(
            "challenge_boss_1",
            player.combat,
            player.stats
        );
        expect(encounter1).not.toBeNull();
        expect(encounter1?.getState()).toBe("in_progress");

        const boss1 = encounter1!.getBossController().getBoss();
        expect(boss1).toBeInstanceOf(Boss1);
        expect(boss1.getMaxHp()).toBe(300);
        expect(boss1.getAttack()).toBe(10);
        expect(boss1.getArmor()).toBe(5);

        // Player attacks and brings boss 1 to phase 2 threshold (<= 150 HP)
        let t = 0;
        while (boss1.getHp() > 150 && !encounter1!.isOver()) {
            encounter1!.playerAttack(t);
            t += 300;
        }
        expect(boss1.getCurrentPhase()).toBe(2);
        expect(boss1.getArmor()).toBe(20);

        // Finish Boss 1
        while (!encounter1!.isOver()) {
            encounter1!.playerAttack(t);
            t += 300;
        }
        expect(boss1.isDead()).toBe(true);
        expect(encounter1!.isPlayerWon()).toBe(true);

        // Verify Quest 1 complete and Boss 2 unlocked
        expect(gs.questManager.isQuestComplete("q_boss_1")).toBe(true);
        expect(gs.bossProgression.isBossDefeated("boss-1")).toBe(true);
        expect(gs.bossProgression.isBossUnlocked("boss-2")).toBe(true);
        expect(gs.bossProgression.canEncounterBoss("boss-2")).toBe(true);

        // Boss 3 must still be locked
        expect(gs.bossProgression.isBossUnlocked("boss-3")).toBe(false);
        expect(gs.bossProgression.canEncounterBoss("boss-3")).toBe(false);

        // =====================================================================
        // STEP 3: FIGHT & DEFEAT BOSS 2
        // =====================================================================
        expect(gs.questManager.getQuest("q_boss_2")?.isActive()).toBe(true);

        const encounter2 = gs.challengeManager.startChallenge(
            "challenge_boss_2",
            player.combat,
            player.stats
        );
        expect(encounter2).not.toBeNull();

        const boss2 = encounter2!.getBossController().getBoss();
        expect(boss2).toBeInstanceOf(Boss2);
        expect(boss2.getMaxHp()).toBe(500);
        expect(boss2.getAttack()).toBe(16);
        expect(boss2.getArmor()).toBe(10);
        expect(boss2.getCurrentPhase()).toBe(1);

        // Player attacks until Boss 2 reaches phase 2 (<= 250 HP)
        while (boss2.getHp() > 250 && !encounter2!.isOver()) {
            encounter2!.playerAttack(t);
            t += 300;
        }
        expect(boss2.getCurrentPhase()).toBe(2);
        expect(boss2.getArmor()).toBe(30); // 10 + 20 = 30

        // Finish Boss 2
        while (!encounter2!.isOver()) {
            encounter2!.playerAttack(t);
            t += 300;
        }
        expect(boss2.isDead()).toBe(true);
        expect(encounter2!.isPlayerWon()).toBe(true);

        // Verify Quest 2 complete and Boss 3 unlocked
        expect(gs.questManager.isQuestComplete("q_boss_2")).toBe(true);
        expect(gs.bossProgression.isBossDefeated("boss-2")).toBe(true);
        expect(gs.bossProgression.isBossUnlocked("boss-3")).toBe(true);
        expect(gs.bossProgression.canEncounterBoss("boss-3")).toBe(true);

        // =====================================================================
        // STEP 4: FIGHT & DEFEAT BOSS 3
        // =====================================================================
        expect(gs.questManager.getQuest("q_boss_3")?.isActive()).toBe(true);

        const encounter3 = gs.challengeManager.startChallenge(
            "challenge_boss_3",
            player.combat,
            player.stats
        );
        expect(encounter3).not.toBeNull();

        const boss3 = encounter3!.getBossController().getBoss();
        expect(boss3).toBeInstanceOf(Boss3);
        expect(boss3.getMaxHp()).toBe(800);
        expect(boss3.getAttack()).toBe(24);
        expect(boss3.getArmor()).toBe(15);
        expect(boss3.getCurrentPhase()).toBe(1);

        // Advance Boss 3 to Phase 2 (HP <= 66.67%, <= 533 HP)
        while (boss3.getHp() > 533 && !encounter3!.isOver()) {
            encounter3!.playerAttack(t);
            t += 300;
        }
        expect(boss3.getCurrentPhase()).toBe(2);
        expect(boss3.getArmor()).toBe(35); // 15 + 20 = 35

        // Advance Boss 3 to Phase 3 (HP <= 33.33%, <= 266 HP)
        while (boss3.getHp() > 266 && !encounter3!.isOver()) {
            encounter3!.playerAttack(t);
            t += 300;
        }
        expect(boss3.getCurrentPhase()).toBe(3);
        expect(boss3.getArmor()).toBe(70); // Cumulative: 15 + 20 + 35 = 70

        // Finish Boss 3
        while (!encounter3!.isOver()) {
            encounter3!.playerAttack(t);
            t += 300;
        }
        expect(boss3.isDead()).toBe(true);
        expect(encounter3!.isPlayerWon()).toBe(true);

        // =====================================================================
        // STEP 5: FINAL REWARDS & PROGRESSION COMPLETION
        // =====================================================================
        expect(gs.questManager.isQuestComplete("q_boss_3")).toBe(true);
        expect(gs.bossProgression.isBossDefeated("boss-3")).toBe(true);
        expect(gs.bossProgression.isProgressionComplete()).toBe(true);
        expect(gs.bossProgression.getCurrentTargetBoss()).toBeNull();

        // Check all memories collected
        expect(gs.memoryManager.isCollected("mem_boss_1_reward")).toBe(true);
        expect(gs.memoryManager.isCollected("mem_boss_2_reward")).toBe(true);
        expect(gs.memoryManager.isCollected("mem_boss_3_graduation")).toBe(true);
    });
});
