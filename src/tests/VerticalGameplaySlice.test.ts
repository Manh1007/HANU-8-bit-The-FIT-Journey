import { describe, expect, test, beforeEach } from "vitest";
import { GameState } from "../systems/GameState";
import { PlayerStats } from "../systems/PlayerStats";
import { PlayerCombat } from "../systems/PlayerCombat";
import { WeaponSystem } from "../systems/WeaponSystem";
import { DamageSystem } from "../systems/DamageSystem";
import { Boss1 } from "../bosses/Boss1";
import { BossCombatSystem } from "../systems/BossCombatSystem";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossCombatController } from "../systems/BossCombatController";
import { BossPhaseBehavior } from "../systems/BossPhaseBehavior";
import type { LocationData } from "../systems/WorldManager";
import type { QuestData } from "../systems/QuestTypes";
import type { AcademicChallengeData } from "../systems/AcademicChallenge";
import type { DialogueTree } from "../systems/DialogueTypes";

// ============================================================
// PHASE A23 — FINAL GAMEPLAY PROTOTYPE
// Vertical Gameplay Slice (17-Step Complete Progression Loop)
// ============================================================

describe("Phase A23 — Final Gameplay Prototype (17-Step Slice)", () => {
    function createTestBossController(): BossCombatController {
        const boss = new Boss1();
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
                armorBonus: 10,
                skill1Multiplier: 2.5,
                skill2Multiplier: 4,
            },
        ]);
        const combatSystem = new BossCombatSystem(boss, boss.getCombatData(), phaseBehavior);
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

    function createPlayer(attack = 200, _hp = 200, armor = 2) {
        const stats = new PlayerStats();
        stats.setArmor(armor);
        const weapon = new WeaponSystem();
        weapon.registerWeapon({
            id: "laptop_dev",
            name: "Laptop Sinh Viên FIT",
            baseDamage: attack,
            attackRange: 50,
            attackCooldown: 300,
        });
        weapon.equipWeapon("laptop_dev");
        const damageSystem = new DamageSystem();
        const combat = new PlayerCombat(stats, weapon, damageSystem);
        return { stats, weapon, combat };
    }

    beforeEach(() => {
        GameState.reset();
        GameState.getInstance().saveManager.deleteSave();
    });

    test("Execute complete 17-step vertical gameplay slice", () => {
        // ========================================================
        // 1. Bắt đầu game
        // ========================================================
        const gs = GameState.getInstance();
        expect(gs).toBeDefined();

        // Load locations
        const locations: LocationData[] = [
            {
                id: "location_campus",
                name: "Khuôn viên HANU",
                description: "Sân trường rợp bóng cây",
                sceneKey: "SceneCampus",
                connectedFrom: [],
            },
            {
                id: "location_nha_c",
                name: "Nhà C — Khoa CNTT",
                description: "Tòa nhà giảng dạy của FIT HANU",
                sceneKey: "SceneNhaC",
                connectedFrom: ["location_campus"],
                unlockQuestId: "q_main_01",
            },
            {
                id: "location_library",
                name: "Thư viện FIT",
                description: "Kho tàng tri thức và tài liệu",
                sceneKey: "SceneLibrary",
                connectedFrom: ["location_nha_c"],
                unlockQuestId: "q_main_02",
            },
        ];
        gs.worldManager.loadLocations(locations);

        // Load NPC
        gs.npcManager.register({
            id: "npc_mentor",
            name: "Thầy Hướng Dẫn",
            x: 100,
            y: 100,
            dialogueId: "dlg_mentor_welcome",
        });

        // Load Dialogue Tree with Branching & Quest Acceptance
        const dialogueTree: DialogueTree = {
            id: "dlg_mentor_welcome",
            startNodeId: "node_greeting",
            nodes: [
                {
                    id: "node_greeting",
                    speaker: "Thầy Hướng Dẫn",
                    text: "Chào mừng em đến với FIT HANU! Em đã sẵn sàng cho hành trình chưa?",
                    nextNodeId: null,
                    choices: [
                        {
                            id: "choice_ready",
                            text: "Em đã sẵn sàng!",
                            nextNodeId: "node_accept",
                            effects: [{ type: "startQuest", value: "q_main_01" }],
                        },
                        {
                            id: "choice_not_yet",
                            text: "Em cần thêm thời gian chuẩn bị.",
                            nextNodeId: null,
                        },
                    ],
                },
                {
                    id: "node_accept",
                    speaker: "Thầy Hướng Dẫn",
                    text: "Tốt lắm! Hãy khám phá khuôn viên và chuẩn bị bước vào Nhà C.",
                    nextNodeId: null,
                },
            ],
        };
        gs.dialogueManager.registerTree(dialogueTree);

        // Load Quests
        const quests: QuestData[] = [
            {
                id: "q_main_01",
                type: "main",
                title: "Bước chân vào FIT HANU",
                description: "Làm quen với thầy hướng dẫn và khuôn viên trường",
                objectives: [
                    { id: "obj_talk", description: "Nói chuyện với Thầy Hướng Dẫn", type: "talk_to_npc", targetId: "npc_mentor", required: 1, current: 0 },
                    { id: "obj_campus", description: "Khám phá Campus", type: "reach_location", targetId: "location_campus", required: 1, current: 0 },
                ],
                rewards: [
                    { type: "unlock_location", value: "location_nha_c" },
                    { type: "unlock_quest", value: "q_main_02" },
                ],
                prerequisites: [],
            },
            {
                id: "q_main_02",
                type: "main",
                title: "Thử Thách Tại Nhà C",
                description: "Vượt qua thử thách lập trình học phần",
                objectives: [
                    { id: "obj_boss", description: "Vượt qua bài thi kết thúc học phần", type: "defeat_enemy", targetId: "boss_programming", required: 1, current: 0 },
                ],
                rewards: [
                    { type: "memory", value: "mem_programming_01" },
                    { type: "unlock_location", value: "location_library" },
                ],
                prerequisites: ["q_main_01"],
            },
        ];
        gs.questManager.loadQuests(quests);

        // Load Memory
        gs.memoryManager.registerMemory({
            id: "mem_programming_01",
            title: "Mảnh ghép Kỷ niệm: Dòng code đầu tiên tại Nhà C",
            description: "Cảm xúc khi chạy thành công chương trình C đầu tiên",
            category: "milestone",
            year: 2004,
            hint: "Hoàn thành thử thách lập trình tại Nhà C",
        });

        // Load Academic Challenge
        const challengeData: AcademicChallengeData = {
            id: "challenge_programming",
            title: "Kiểm tra kết thúc học phần: Lập trình C",
            subject: "Nhập môn Lập trình",
            description: "Thử thách kiến thức lập trình cơ bản",
            bossId: "boss_programming",
            locationId: "location_nha_c",
            requiredQuestId: "q_main_02",
            rewardMemoryIds: ["mem_programming_01"],
            unlockLocationId: "location_library",
        };
        gs.challengeManager.registerChallenge(challengeData, () => createTestBossController());

        // Initialize Player
        const player = createPlayer(250, 200, 2);

        // Assert step 1
        expect(gs.worldManager.isUnlocked("location_campus")).toBe(true);
        expect(gs.worldManager.isUnlocked("location_nha_c")).toBe(false);
        expect(gs.questManager.getActiveQuests()).toHaveLength(0);

        // ========================================================
        // 2. Khám phá Campus
        // ========================================================
        gs.worldManager.visitLocation("location_campus");
        expect(gs.worldManager.getLocation("location_campus")?.status).toBe("visited");

        // ========================================================
        // 3. Gặp NPC
        // ========================================================
        const playerX = 85;
        const playerY = 90;
        const nearbyNpc = gs.npcManager.getNearestNPC(playerX, playerY);
        expect(nearbyNpc).not.toBeNull();
        expect(nearbyNpc?.getId()).toBe("npc_mentor");
        expect(nearbyNpc?.isInteractionEnabled()).toBe(true);

        // ========================================================
        // 4. Nói chuyện
        // ========================================================
        const dialogueStarted = gs.dialogueManager.start(nearbyNpc!.getDialogueId()!);
        expect(dialogueStarted.status).toBe("waiting_for_choice");
        expect(dialogueStarted.currentNode?.id).toBe("node_greeting");

        // Select choice to accept quest
        const choiceMade = gs.dialogueManager.selectChoice("choice_ready");
        expect(choiceMade.status).not.toBe("idle");

        // ========================================================
        // 5. Nhận Main Quest
        // ========================================================
        gs.processDialogueEffects();
        expect(gs.questManager.getQuest("q_main_01")?.isActive()).toBe(true);
        expect(gs.questManager.getActiveQuests()).toHaveLength(1);

        // ========================================================
        // 6. Hoàn thành Objective
        // ========================================================
        gs.onGameEvent("talk_to_npc", "npc_mentor");
        gs.onGameEvent("reach_location", "location_campus");

        const quest1 = gs.questManager.getQuest("q_main_01");
        expect(quest1?.isCompleted()).toBe(true);

        // ========================================================
        // 7. Unlock Nhà C
        // ========================================================
        // Completed quest 1 automatically unlocked Nhà C and started quest 2
        expect(gs.worldManager.isUnlocked("location_nha_c")).toBe(true);
        expect(gs.questManager.getQuest("q_main_02")?.isActive()).toBe(true);

        // ========================================================
        // 8. Đi vào Nhà C
        // ========================================================
        const canEnterNhaC = gs.worldManager.canTravelTo("location_nha_c");
        expect(canEnterNhaC).toBe(true);
        gs.worldManager.visitLocation("location_nha_c");
        expect(gs.worldManager.getLocation("location_nha_c")?.status).toBe("visited");

        // ========================================================
        // 9. Gặp challenge
        // ========================================================
        const encounter = gs.challengeManager.startChallenge(
            "challenge_programming",
            player.combat,
            player.stats
        );
        expect(encounter).not.toBeNull();
        expect(encounter?.getState()).toBe("in_progress");

        // ========================================================
        // 10. Combat hoặc Minigame
        // ========================================================
        // Turn 1: Player attacks
        const attack1 = encounter!.playerAttack(0);
        expect(attack1.attackResult?.success).toBe(true);
        expect(attack1.bossDefeated).toBe(false);

        // Boss counterattacks
        const bossAction = encounter!.bossAction(100);
        expect(bossAction.combatResult.success).toBe(true);
        expect(bossAction.playerDied).toBe(false);

        // Turn 2: Player delivers final attack (cooldown is 300ms)
        const attack2 = encounter!.playerAttack(400);
        expect(attack2.attackResult?.success).toBe(true);
        expect(attack2.bossDefeated).toBe(true);
        expect(encounter!.isPlayerWon()).toBe(true);

        // ========================================================
        // 11. Nhận reward
        // ========================================================
        // Challenge victory dispatched defeat_enemy event to GameState
        const quest2 = gs.questManager.getQuest("q_main_02");
        expect(quest2?.isCompleted()).toBe(true);

        // ========================================================
        // 12. Nhận Memory
        // ========================================================
        expect(gs.memoryManager.isCollected("mem_programming_01")).toBe(true);
        const collectedMemories = gs.memoryManager.getCollected();
        expect(collectedMemories).toHaveLength(1);
        expect(collectedMemories[0].id).toBe("mem_programming_01");

        // ========================================================
        // 13. Hoàn thành Quest
        // ========================================================
        expect(gs.questManager.isQuestComplete("q_main_01")).toBe(true);
        expect(gs.questManager.isQuestComplete("q_main_02")).toBe(true);

        // ========================================================
        // 14. Unlock location tiếp theo (Thư viện)
        // ========================================================
        expect(gs.worldManager.isUnlocked("location_library")).toBe(true);

        // ========================================================
        // 15. Save game
        // ========================================================
        const saved = gs.save(150, 200, "SceneNhaC");
        expect(saved).toBe(true);

        // ========================================================
        // 16. Reload game
        // ========================================================
        GameState.reset();
        const loadedGs = GameState.getInstance();

        // Pre-register definitions on fresh GameState so deserialize can map them
        loadedGs.worldManager.loadLocations(locations);
        loadedGs.questManager.loadQuests(quests);
        loadedGs.memoryManager.registerMemory({
            id: "mem_programming_01",
            title: "Mảnh ghép Kỷ niệm: Dòng code đầu tiên tại Nhà C",
            description: "",
            category: "milestone",
            hint: "",
        });

        const loadSuccess = loadedGs.load(new Map());
        expect(loadSuccess).toBe(true);

        // ========================================================
        // 17. Tiếp tục progression
        // ========================================================
        // Verify restored state after load
        expect(loadedGs.questManager.isQuestComplete("q_main_01")).toBe(true);
        expect(loadedGs.questManager.isQuestComplete("q_main_02")).toBe(true);
        expect(loadedGs.memoryManager.isCollected("mem_programming_01")).toBe(true);
        expect(loadedGs.worldManager.isUnlocked("location_nha_c")).toBe(true);
        expect(loadedGs.worldManager.isUnlocked("location_library")).toBe(true);
        expect(loadedGs.worldManager.canTravelTo("location_library")).toBe(true);

        // Player can now immediately travel to the newly unlocked Library!
        loadedGs.worldManager.visitLocation("location_library");
        expect(loadedGs.worldManager.getLocation("location_library")?.status).toBe("visited");
    });
});
