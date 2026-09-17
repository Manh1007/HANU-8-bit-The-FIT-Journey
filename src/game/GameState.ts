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

export class GameState {
    private data: GameStateData;

    constructor() {
        this.data = {
            player: {
                name: "Student",
                year: 1,
                semester: 1,
                xp: 0,
            },

            quests: {
                active: [],
                completed: [],
            },

            world: {
                unlockedLocations: ["campus"],
            },

            memories: [],
        };
    }

    getData(): GameStateData {
        return this.data;
    }

    addXP(amount: number): void {
        this.data.player.xp += amount;
    }

    startQuest(questId: string): void {
        if (!this.data.quests.active.includes(questId)) {
            this.data.quests.active.push(questId);
        }
    }

    completeQuest(questId: string): void {
        this.data.quests.active =
            this.data.quests.active.filter(
                (id) => id !== questId
            );

        if (!this.data.quests.completed.includes(questId)) {
            this.data.quests.completed.push(questId);
        }
    }

    unlockLocation(locationId: string): void {
        if (!this.data.world.unlockedLocations.includes(locationId)) {
            this.data.world.unlockedLocations.push(locationId);
        }
    }

    isLocationUnlocked(locationId: string): boolean {
        return this.data.world.unlockedLocations.includes(locationId);
    }

    addMemory(memoryId: string): void {
        if (!this.data.memories.includes(memoryId)) {
            this.data.memories.push(memoryId);
        }
    }
}

export const gameState = new GameState();