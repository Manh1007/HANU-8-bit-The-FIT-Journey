import { describe, expect, test, beforeEach } from "vitest";
import { GameState as SystemsGameState } from "../systems/GameState";
import { GameState as GameGameState, gameState } from "../game/GameState";

describe("GameState Architectural Unification", () => {
    beforeEach(() => {
        SystemsGameState.reset();
    });

    test("Both module exports reference the exact same GameState class and singleton", () => {
        expect(GameGameState).toBe(SystemsGameState);
        const instance1 = GameGameState.getInstance();
        const instance2 = SystemsGameState.getInstance();
        expect(instance1).toBe(instance2);
    });

    test("gameState bridge delegates operations directly to GameState singleton", () => {
        const gs = SystemsGameState.getInstance();

        // Test XP delegation
        expect(gs.getFlag("player_xp")).toBeUndefined();
        gameState.addXP(50);
        expect(gs.getFlag("player_xp")).toBe(50);
        gameState.addXP(25);
        expect(gs.getFlag("player_xp")).toBe(75);

        // Test Quest delegation
        gs.questManager.loadQuests([
            {
                id: "q_test",
                type: "main",
                title: "Test Quest",
                description: "",
                objectives: [],
                rewards: [],
                prerequisites: [],
            },
        ]);
        gameState.startQuest("q_test");
        expect(gs.questManager.hasQuest("q_test")).toBe(true);
        expect(gameState.getData().quests.active).toContain("q_test");

        gameState.completeQuest("q_test");
        expect(gs.questManager.isQuestComplete("q_test")).toBe(true);
        expect(gameState.getData().quests.completed).toContain("q_test");

        // Test Memory delegation
        gs.memoryManager.registerMemory({
            id: "mem_test",
            title: "Test Memory",
            description: "",
            category: "milestone",
            hint: "",
        });
        gameState.addMemory("mem_test");
        expect(gs.memoryManager.isCollected("mem_test")).toBe(true);
        expect(gameState.getData().memories).toContain("mem_test");

        // Test World delegation
        gs.worldManager.loadLocations([
            {
                id: "loc_bridge_test",
                name: "Bridge Location",
                description: "",
                sceneKey: "SceneTest",
                connectedFrom: ["loc_prev"],
            },
        ]);
        expect(gameState.isLocationUnlocked("loc_bridge_test")).toBe(false);
        gameState.unlockLocation("loc_bridge_test");
        expect(gameState.isLocationUnlocked("loc_bridge_test")).toBe(true);
        expect(gameState.getData().world.unlockedLocations).toContain("loc_bridge_test");
    });
});
