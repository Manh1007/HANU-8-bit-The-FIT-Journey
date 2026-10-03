import type { QuestStatus } from "./QuestTypes";
import type { LocationStatus } from "./WorldManager";
import type { BossProgressionState } from "./BossProgression";

// ============================================================
// Save Data Schema (Phase A18)
// ============================================================

export interface PlayerSaveData {
    hp: number;
    maxHp: number;
    armor: number;
    attack: number;
    x: number;
    y: number;
    currentSceneKey: string;
}

export interface SaveData {
    version: number;
    timestamp: number;
    player: PlayerSaveData;
    quests: Record<string, { status: QuestStatus; objectives: { id: string; current: number }[] }>;
    inventory: { itemId: string; quantity: number }[];
    memories: { collected: string[]; viewed: string[] };
    locations: Record<string, LocationStatus>;
    flags: Record<string, boolean | number | string>;
    challenges?: { completed: string[] };
    bossProgression?: BossProgressionState;
}

const SAVE_KEY = "fit_hanu_save";
const SAVE_VERSION = 1;

// ============================================================
// SaveManager
// ============================================================

/**
 * SaveManager — handles save/load via localStorage.
 *
 * Call `save(data)` with a fully assembled SaveData object.
 * Call `load()` to retrieve it.
 * Each system (QuestManager, InventoryManager, etc.) provides
 * its own serialize/deserialize methods; GameState assembles them.
 */
export class SaveManager {
    private readonly key: string;

    constructor(saveKey = SAVE_KEY) {
        this.key = saveKey;
    }

    private static memoryStore: Map<string, string> = new Map();

    private getStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } {
        if (typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined" && globalThis.localStorage !== null) {
            try {
                // Verify localStorage is accessible
                const testKey = "__fit_test_storage__";
                globalThis.localStorage.setItem(testKey, "1");
                globalThis.localStorage.removeItem(testKey);
                return globalThis.localStorage;
            } catch {
                // fall through to memoryStore
            }
        }
        return {
            getItem: (k: string) => SaveManager.memoryStore.get(k) ?? null,
            setItem: (k: string, v: string) => { SaveManager.memoryStore.set(k, v); },
            removeItem: (k: string) => { SaveManager.memoryStore.delete(k); },
        };
    }

    // ============================================================
    // Save
    // ============================================================

    save(data: Omit<SaveData, "version" | "timestamp">): boolean {
        try {
            const saveData: SaveData = {
                version: SAVE_VERSION,
                timestamp: Date.now(),
                ...data,
            };
            this.getStorage().setItem(this.key, JSON.stringify(saveData));
            return true;
        } catch {
            return false;
        }
    }

    // ============================================================
    // Load
    // ============================================================

    load(): SaveData | null {
        try {
            const raw = this.getStorage().getItem(this.key);
            if (!raw) return null;

            const data = JSON.parse(raw) as SaveData;

            // Version migration hook
            if (data.version !== SAVE_VERSION) {
                return this.migrate(data);
            }

            return data;
        } catch {
            return null;
        }
    }

    hasSave(): boolean {
        return this.getStorage().getItem(this.key) !== null;
    }

    deleteSave(): void {
        this.getStorage().removeItem(this.key);
    }

    getSaveTimestamp(): number | null {
        const data = this.load();
        return data?.timestamp ?? null;
    }

    // ============================================================
    // Migration (future-proofing)
    // ============================================================

    private migrate(data: SaveData): SaveData | null {
        // v1 is current — no migration needed yet
        // Future: if (data.version === 0) { ... upgrade to v1 ... }
        if (data.version < SAVE_VERSION) {
            // best-effort: return as-is with updated version
            data.version = SAVE_VERSION;
            return data;
        }
        return data;
    }

    // ============================================================
    // Default save data (new game)
    // ============================================================

    static createNewGameSave(playerScene: string, playerX: number, playerY: number): Omit<SaveData, "version" | "timestamp"> {
        return {
            player: {
                hp: 100,
                maxHp: 100,
                armor: 0,
                attack: 10,
                x: playerX,
                y: playerY,
                currentSceneKey: playerScene,
            },
            quests: {},
            inventory: [],
            memories: { collected: [], viewed: [] },
            locations: {},
            flags: {},
        };
    }
}
