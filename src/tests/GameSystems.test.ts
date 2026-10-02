import { describe, expect, test, beforeEach } from "vitest";
import { QuestManager } from "../systems/QuestManager";
import { InventoryManager } from "../systems/InventoryManager";
import { MemoryManager } from "../systems/MemoryManager";
import { WorldManager } from "../systems/WorldManager";
import { MinigameRunner, TypingMinigame } from "../systems/MinigameSystem";
import { GameState } from "../systems/GameState";
import type { QuestData } from "../systems/QuestTypes";
import type { ItemData } from "../systems/InventoryManager";
import type { MemoryData } from "../systems/MemoryManager";
import type { LocationData } from "../systems/WorldManager";

// ============================================================
// Phase A13 — Quest System
// ============================================================

const QUEST_DEF: QuestData = {
    id: "q_test_01",
    type: "main",
    title: "Test Quest",
    description: "A test quest",
    objectives: [
        { id: "obj_1", description: "Talk to NPC", type: "talk_to_npc", targetId: "npc_a", required: 1, current: 0 },
        { id: "obj_2", description: "Kill enemy", type: "defeat_enemy", targetId: "enemy_b", required: 3, current: 0 },
    ],
    rewards: [{ type: "memory", value: "mem_01" }],
    prerequisites: [],
};

const QUEST_DEF_2: QuestData = {
    id: "q_test_02",
    type: "side",
    title: "Dependent Quest",
    description: "",
    objectives: [{ id: "obj_3", description: "Explore", type: "reach_location", targetId: "loc_a", required: 1, current: 0 }],
    rewards: [],
    prerequisites: ["q_test_01"],
};

describe("Phase A13 — QuestManager", () => {
    let manager: QuestManager;

    beforeEach(() => {
        manager = new QuestManager();
        manager.loadQuests([QUEST_DEF, QUEST_DEF_2]);
    });

    test("should load quests with correct initial status", () => {
        expect(manager.getQuest("q_test_01")?.getStatus()).toBe("available");
        expect(manager.getQuest("q_test_02")?.getStatus()).toBe("locked"); // has prerequisite
    });

    test("should start a quest", () => {
        expect(manager.startQuest("q_test_01")).toBe(true);
        expect(manager.getQuest("q_test_01")?.isActive()).toBe(true);
    });

    test("should not start locked quest", () => {
        expect(manager.startQuest("q_test_02")).toBe(false);
    });

    test("should advance objective on game event", () => {
        manager.startQuest("q_test_01");
        manager.onEvent("defeat_enemy", "enemy_b", 2);
        const q = manager.getQuest("q_test_01")!;
        const objs = q.getObjectives();
        const killObj = objs.find((o) => o.id === "obj_2")!;
        expect(killObj.current).toBe(2);
    });

    test("should complete quest when all objectives done (no turn-in NPC)", () => {
        manager.startQuest("q_test_01");
        manager.onEvent("talk_to_npc", "npc_a");
        manager.onEvent("defeat_enemy", "enemy_b", 3);
        expect(manager.getQuest("q_test_01")?.isCompleted()).toBe(true);
    });

    test("should unlock dependent quest after completing prerequisite", () => {
        manager.startQuest("q_test_01");
        manager.onEvent("talk_to_npc", "npc_a");
        manager.onEvent("defeat_enemy", "enemy_b", 3);
        // q_test_01 is now complete → q_test_02 should unlock
        expect(manager.getQuest("q_test_02")?.getStatus()).toBe("available");
    });

    test("should emit events", () => {
        const events: string[] = [];
        manager.addEventListener((p) => events.push(p.event));
        manager.startQuest("q_test_01");
        manager.onEvent("talk_to_npc", "npc_a");
        manager.onEvent("defeat_enemy", "enemy_b", 3);
        expect(events).toContain("quest_started");
        expect(events).toContain("quest_objective_updated");
        expect(events).toContain("quest_completed");
        expect(events).toContain("quest_available"); // q_test_02 unlocked
    });

    test("should serialize and deserialize", () => {
        manager.startQuest("q_test_01");
        manager.onEvent("defeat_enemy", "enemy_b", 2);
        const saved = manager.serialize();

        const manager2 = new QuestManager();
        manager2.loadQuests([QUEST_DEF, QUEST_DEF_2]);
        manager2.deserialize(saved);

        expect(manager2.getQuest("q_test_01")?.isActive()).toBe(true);
    });

    test("should track completion percentage", () => {
        manager.startQuest("q_test_01");
        manager.onEvent("talk_to_npc", "npc_a");
        // 1 of 4 total required done
        const q = manager.getQuest("q_test_01")!;
        expect(q.getCompletionPercent()).toBeGreaterThan(0);
        expect(q.getCompletionPercent()).toBeLessThan(100);
    });
});

// ============================================================
// Phase A14 — World / Location
// ============================================================

const LOCATIONS: LocationData[] = [
    { id: "loc_start", name: "Start", description: "", sceneKey: "S1", connectedFrom: [], mapX: 0, mapY: 0 },
    { id: "loc_a", name: "Area A", description: "", sceneKey: "S2", connectedFrom: ["loc_start"], mapX: 100, mapY: 0 },
    { id: "loc_b", name: "Area B", description: "", sceneKey: "S3", connectedFrom: ["loc_a"], mapX: 200, mapY: 0, unlockQuestId: "q_test_01" },
];

describe("Phase A14 — WorldManager", () => {
    let world: WorldManager;

    beforeEach(() => {
        world = new WorldManager();
        world.loadLocations(LOCATIONS);
    });

    test("should start root location unlocked", () => {
        expect(world.isUnlocked("loc_start")).toBe(true);
        expect(world.isUnlocked("loc_a")).toBe(false);
    });

    test("should unlock a location", () => {
        world.unlockLocation("loc_a");
        expect(world.isUnlocked("loc_a")).toBe(true);
    });

    test("should visit a location", () => {
        world.unlockLocation("loc_a");
        world.visitLocation("loc_a");
        expect(world.getStatus("loc_a")).toBe("visited");
    });

    test("should complete a location", () => {
        world.unlockLocation("loc_a");
        world.completeLocation("loc_a");
        expect(world.getStatus("loc_a")).toBe("completed");
    });

    test("should not visit locked location", () => {
        const result = world.visitLocation("loc_b");
        expect(result).toBe(false);
    });

    test("should serialize and deserialize", () => {
        world.unlockLocation("loc_a");
        const saved = world.serialize();
        const world2 = new WorldManager();
        world2.loadLocations(LOCATIONS);
        world2.deserialize(saved);
        expect(world2.isUnlocked("loc_a")).toBe(true);
    });
});

// ============================================================
// Phase A15 — Inventory
// ============================================================

const SWORD_ITEM: ItemData = {
    id: "item_sword", name: "Sword", description: "", type: "equipment",
    rarity: "common", stackable: false, maxStack: 1,
};

const POTION_ITEM: ItemData = {
    id: "item_potion", name: "Potion", description: "", type: "consumable",
    rarity: "common", stackable: true, maxStack: 10,
};

describe("Phase A15 — InventoryManager", () => {
    let inv: InventoryManager;

    beforeEach(() => {
        inv = new InventoryManager(5);
    });

    test("should add non-stackable item", () => {
        inv.addItem(SWORD_ITEM);
        expect(inv.hasItem("item_sword")).toBe(true);
        expect(inv.getQuantity("item_sword")).toBe(1);
    });

    test("should stack consumable items", () => {
        inv.addItem(POTION_ITEM, 3);
        inv.addItem(POTION_ITEM, 4);
        expect(inv.getQuantity("item_potion")).toBe(7);
        expect(inv.getSlotCount()).toBe(1); // merged into one slot
    });

    test("should respect max stack", () => {
        inv.addItem(POTION_ITEM, 15); // maxStack=10
        expect(inv.getQuantity("item_potion")).toBe(15);
        expect(inv.getSlotCount()).toBe(2); // two stacks: 10 + 5
    });

    test("should remove item", () => {
        inv.addItem(POTION_ITEM, 5);
        inv.removeItem("item_potion", 3);
        expect(inv.getQuantity("item_potion")).toBe(2);
    });

    test("should return false when removing more than available", () => {
        inv.addItem(POTION_ITEM, 2);
        expect(inv.removeItem("item_potion", 5)).toBe(false);
    });

    test("should respect max slots capacity", () => {
        const events: string[] = [];
        inv.addEventListener((e) => events.push(e.event));
        // Fill 5 slots with non-stackable items (by adding 6 times)
        for (let i = 0; i < 6; i++) {
            inv.addItem(SWORD_ITEM);
        }
        expect(inv.isFull()).toBe(true);
        expect(events).toContain("inventory_full");
    });

    test("should serialize and deserialize", () => {
        inv.addItem(POTION_ITEM, 3);
        const saved = inv.serialize();
        const inv2 = new InventoryManager(5);
        const lookup = new Map<string, ItemData>([["item_potion", POTION_ITEM]]);
        inv2.deserialize(saved, lookup);
        expect(inv2.getQuantity("item_potion")).toBe(3);
    });
});

// ============================================================
// Phase A16 — Memory
// ============================================================

const MEMORIES: MemoryData[] = [
    { id: "mem_01", title: "Memory 1", description: "", category: "founding", hint: "" },
    { id: "mem_02", title: "Memory 2", description: "", category: "milestone", hint: "" },
    { id: "mem_03", title: "Memory 3", description: "", category: "founding", hint: "" },
];

describe("Phase A16 — MemoryManager", () => {
    let memory: MemoryManager;

    beforeEach(() => {
        memory = new MemoryManager();
        memory.loadMemories(MEMORIES);
    });

    test("should start with no collected memories", () => {
        expect(memory.getCollectedCount()).toBe(0);
        expect(memory.getTotalCount()).toBe(3);
    });

    test("should collect a memory", () => {
        memory.collect("mem_01");
        expect(memory.isCollected("mem_01")).toBe(true);
        expect(memory.getCollectedCount()).toBe(1);
    });

    test("should not collect same memory twice", () => {
        memory.collect("mem_01");
        expect(memory.collect("mem_01")).toBe(false);
        expect(memory.getCollectedCount()).toBe(1);
    });

    test("should calculate completion percent", () => {
        memory.collect("mem_01");
        memory.collect("mem_02");
        expect(memory.getCompletionPercent()).toBe(67); // 2/3
    });

    test("should filter by category", () => {
        memory.collect("mem_01");
        memory.collect("mem_03");
        const founding = memory.getByCategory("founding");
        expect(founding).toHaveLength(2);
    });

    test("should track viewed/unviewed", () => {
        memory.collect("mem_01");
        expect(memory.getUnviewedCount()).toBe(1);
        memory.viewMemory("mem_01");
        expect(memory.getUnviewedCount()).toBe(0);
    });

    test("should serialize and deserialize", () => {
        memory.collect("mem_01");
        memory.viewMemory("mem_01");
        const saved = memory.serialize();
        const mem2 = new MemoryManager();
        mem2.loadMemories(MEMORIES);
        mem2.deserialize(saved);
        expect(mem2.isCollected("mem_01")).toBe(true);
        expect(mem2.isViewed("mem_01")).toBe(true);
    });
});

// ============================================================
// Phase A17 — Minigame Framework
// ============================================================

describe("Phase A17 — Minigame Framework", () => {
    test("TypingMinigame: should complete when all words typed correctly", () => {
        const game = new TypingMinigame({
            id: "typing_01", title: "Typing", description: "",
            timeLimit: 0, lives: 3, words: ["print", "if", "for"],
        });

        game.start();
        expect(game.isRunning()).toBe(true);

        const r1 = game.submitWord("print");
        expect(r1.correct).toBe(true);
        expect(r1.result).toBeNull();

        game.submitWord("if");
        const r3 = game.submitWord("for");
        expect(r3.result?.status).toBe("completed");
        expect(r3.result?.score).toBe(300);
    });

    test("TypingMinigame: should lose life on wrong word", () => {
        const game = new TypingMinigame({
            id: "typing_01", title: "", description: "",
            timeLimit: 0, lives: 2, words: ["print"],
        });
        game.start();
        game.submitWord("wrong"); // lose life
        expect(game.getLivesRemaining()).toBe(1);
    });

    test("TypingMinigame: should fail when lives run out", () => {
        const game = new TypingMinigame({
            id: "typing_01", title: "", description: "",
            timeLimit: 0, lives: 1, words: ["print"],
        });
        game.start();
        const result = game.submitWord("wrong");
        expect(result.result?.status).toBe("failed");
    });

    test("TypingMinigame: should fail when time limit exceeded", () => {
        const game = new TypingMinigame({
            id: "typing_01", title: "", description: "",
            timeLimit: 1, lives: 3, words: ["print"],
        });
        game.start();
        // Simulate 1.1 seconds passing
        const result = game.update(1100);
        expect(result?.status).toBe("failed");
    });

    test("MinigameRunner: should emit result when game ends", () => {
        const runner = new MinigameRunner();
        const game = new TypingMinigame({
            id: "typing_01", title: "", description: "",
            timeLimit: 0, lives: 1, words: ["hi"],
        });

        const results: string[] = [];
        runner.addEventListener((r) => results.push(r.status));
        runner.startMinigame(game);
        runner.update(16);

        // Submit correct word to complete
        game.submitWord("hi");
        runner.update(16);

        expect(results).toContain("completed");
    });
});

// ============================================================
// Phase A22 — Complete Gameplay Loop (Integration)
// ============================================================

describe("Phase A22 — Complete Gameplay Loop", () => {
    beforeEach(() => {
        GameState.reset();
    });

    test("GameState singleton should be created", () => {
        const gs = GameState.getInstance();
        expect(gs).not.toBeNull();
        expect(gs.questManager).not.toBeNull();
        expect(gs.inventoryManager).not.toBeNull();
        expect(gs.memoryManager).not.toBeNull();
    });

    test("Full loop: quest start → objective → memory reward", () => {
        const gs = GameState.getInstance();

        // Load data
        gs.questManager.loadQuests([{
            id: "q_loop_01",
            type: "main",
            title: "Loop Quest",
            description: "",
            objectives: [
                { id: "o1", description: "", type: "defeat_enemy", targetId: "boss_01", required: 1, current: 0 },
            ],
            rewards: [{ type: "memory", value: "mem_01" }],
            prerequisites: [],
        }]);

        gs.memoryManager.registerMemory({
            id: "mem_01", title: "Memory", description: "", category: "founding", hint: "",
        });

        // Start quest
        gs.questManager.startQuest("q_loop_01");
        expect(gs.questManager.getActiveQuests()).toHaveLength(1);

        // Defeat boss
        gs.onGameEvent("defeat_enemy", "boss_01");
        expect(gs.questManager.getQuest("q_loop_01")?.isCompleted()).toBe(true);

        // Apply rewards
        gs.applyQuestRewards("q_loop_01");
        // Memory should be collected
        expect(gs.memoryManager.isCollected("mem_01")).toBe(true);
    });

    test("Flag system: set and evaluate flags", () => {
        const gs = GameState.getInstance();
        gs.setFlag("saw_intro", true);
        expect(gs.hasFlag("saw_intro")).toBe(true);
        expect(gs.evaluateCondition({ type: "flag", value: "saw_intro" })).toBe(true);
        expect(gs.evaluateCondition({ type: "flag", value: "missing_flag" })).toBe(false);
    });

    test("Dialogue effect: startQuest via dialogue", () => {
        const gs = GameState.getInstance();

        gs.questManager.loadQuests([{
            id: "q_dlg_01",
            type: "side",
            title: "Dialogue Quest",
            description: "",
            objectives: [],
            rewards: [],
            prerequisites: [],
        }]);

        // Register and start a dialogue that has startQuest effect
        gs.dialogueManager.registerTree({
            id: "dlg_npc_01",
            startNodeId: "n1",
            nodes: [{
                id: "n1",
                speaker: "NPC",
                text: "Chào!",
                nextNodeId: null,
                effects: [{ type: "startQuest", value: "q_dlg_01" }],
            }],
        });

        gs.dialogueManager.start("dlg_npc_01");
        gs.processDialogueEffects();

        expect(gs.questManager.getQuest("q_dlg_01")?.isActive()).toBe(true);
    });
});
