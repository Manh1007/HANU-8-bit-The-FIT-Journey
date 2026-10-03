/**
 * UNIFIED GAME STATE BRIDGE
 *
 * Resolves architectural duality:
 * Delegates all state operations to the canonical GameState singleton
 * in `src/systems/GameState.ts`.
 */

import { GameState } from "../systems/GameState";

export { GameState } from "../systems/GameState";

export interface PlayerState {
    name: string;
    year: number;
    semester: number;
    xp: number;
}

export interface QuestState {
    active: string[];
    completed: string[];
}

export interface WorldState {
    unlockedLocations: string[];
}

export interface GameStateData {
    player: PlayerState;
    quests: QuestState;
    world: WorldState;
    memories: string[];
}

/**
 * Backward compatibility adapter for legacy code importing `gameState`.
 * Proxies calls directly to `GameState.getInstance()`.
 */
export const gameState = {
    get instance(): GameState {
        return GameState.getInstance();
    },

    getData(): GameStateData {
        const gs = GameState.getInstance();
        return {
            player: {
                name: (gs.getFlag("player_name") as string) || "Student",
                year: (gs.getFlag("player_year") as number) || 1,
                semester: (gs.getFlag("player_semester") as number) || 1,
                xp: (gs.getFlag("player_xp") as number) || 0,
            },
            quests: {
                active: gs.questManager.getActiveQuests().map((q) => q.getId()),
                completed: gs.questManager.getCompletedQuests().map((q) => q.getId()),
            },
            world: {
                unlockedLocations: gs.worldManager.getUnlockedLocations().map((l) => l.id),
            },
            memories: gs.memoryManager.getCollected().map((m) => m.id),
        };
    },

    addXP(amount: number): void {
        const gs = GameState.getInstance();
        const currentXP = Number(gs.getFlag("player_xp") ?? 0);
        gs.setFlag("player_xp", currentXP + amount);
    },

    startQuest(questId: string): void {
        GameState.getInstance().questManager.startQuest(questId);
    },

    completeQuest(questId: string): void {
        GameState.getInstance().questManager.completeQuest(questId);
    },

    unlockLocation(locationId: string): void {
        GameState.getInstance().worldManager.unlockLocation(locationId);
    },

    isLocationUnlocked(locationId: string): boolean {
        return GameState.getInstance().worldManager.isUnlocked(locationId);
    },

    addMemory(memoryId: string): void {
        GameState.getInstance().memoryManager.collect(memoryId);
    },
};