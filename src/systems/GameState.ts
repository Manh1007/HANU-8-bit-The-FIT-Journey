import { QuestManager } from "./QuestManager";
import { InventoryManager } from "./InventoryManager";
import { MemoryManager } from "./MemoryManager";
import { WorldManager } from "./WorldManager";
import { NPCManager } from "./NPCManager";
import { DialogueManager } from "./DialogueManager";
import { MinigameRunner } from "./MinigameSystem";
import { SaveManager } from "./SaveManager";
import { AcademicChallengeManager, type AcademicChallengeData } from "./AcademicChallenge";
import { BossProgressionManager } from "./BossProgression";
import type { BossId } from "../bosses/BossRegistry";
import type { ItemData } from "./InventoryManager";
import type { DialogueCondition } from "./DialogueTypes";
import type { QuestObjective, QuestReward } from "./QuestTypes";

// ============================================================
// GameState — Single source of truth for all gameplay systems
// ============================================================

/**
 * GameState wires together all gameplay managers.
 *
 * Usage in Phaser scenes:
 *   const gs = GameState.getInstance();
 *   gs.npcManager.interact(player.x, player.y);
 *   gs.questManager.onEvent("talk_to_npc", "npc_minh");
 *
 * Scenes should NOT hold system instances directly — always go through GameState.
 */
export class GameState {
    private static _instance: GameState | null = null;

    // ---- Gameplay Systems ----
    readonly questManager: QuestManager;
    readonly inventoryManager: InventoryManager;
    readonly memoryManager: MemoryManager;
    readonly worldManager: WorldManager;
    readonly npcManager: NPCManager;
    readonly dialogueManager: DialogueManager;
    readonly minigameRunner: MinigameRunner;
    readonly saveManager: SaveManager;
    readonly challengeManager: AcademicChallengeManager;
    readonly bossProgression: BossProgressionManager;

    // ---- Runtime Flags ----
    private flags: Map<string, boolean | number | string> = new Map();

    private constructor() {
        this.questManager = new QuestManager();
        this.inventoryManager = new InventoryManager(24);
        this.memoryManager = new MemoryManager();
        this.worldManager = new WorldManager();
        this.npcManager = new NPCManager(60);
        this.saveManager = new SaveManager();
        this.minigameRunner = new MinigameRunner();
        this.challengeManager = new AcademicChallengeManager();
        this.bossProgression = new BossProgressionManager();

        // Build dialogue condition evaluator that queries other systems
        this.dialogueManager = new DialogueManager(
            (condition: DialogueCondition) => this.evaluateCondition(condition)
        );

        // Wire quest events to world + memory unlocks
        this.questManager.addEventListener((payload) => {
            if (payload.event === "quest_completed") {
                this.onQuestCompleted(payload.questId);
            }
        });

        // Wire challenge victory to game progression
        this.challengeManager.setOnChallengeWonListener((challenge) => {
            this.onChallengeWon(challenge);
        });
    }

    static getInstance(): GameState {
        if (!GameState._instance) {
            GameState._instance = new GameState();
        }
        return GameState._instance;
    }

    /** Reset for new game or tests */
    static reset(): void {
        GameState._instance = null;
    }

    // ============================================================
    // Condition evaluator (for DialogueManager)
    // ============================================================

    evaluateCondition(condition: DialogueCondition): boolean {
        switch (condition.type) {
            case "hasQuest":
                return this.questManager.hasQuest(condition.value);
            case "questComplete":
                return this.questManager.isQuestComplete(condition.value);
            case "hasItem":
                return this.inventoryManager.hasItem(condition.value);
            case "hasMemory":
                return this.memoryManager.isCollected(condition.value);
            case "flag":
                return Boolean(this.flags.get(condition.value));
            default:
                return false;
        }
    }

    // ============================================================
    // Unified event dispatcher (called by scenes on game events)
    // ============================================================

    /**
     * Notify GameState that a gameplay event occurred.
     * Routes to relevant systems automatically.
     */
    onGameEvent(type: QuestObjective["type"], targetId: string, amount = 1): void {
        this.questManager.onEvent(type, targetId, amount);

        if (type === "defeat_enemy" && (targetId === "boss-1" || targetId === "boss-2" || targetId === "boss-3")) {
            const bossId = targetId as BossId;
            if (!this.bossProgression.isBossDefeated(bossId) && this.bossProgression.canEncounterBoss(bossId)) {
                this.bossProgression.recordBossDefeat(bossId);
            }
        }
    }

    // ============================================================
    // Dialogue → Game integration
    // ============================================================

    /**
     * Process dialogue effects after each dialogue advance.
     * Call after `dialogueManager.advance()` or `selectChoice()`.
     */
    processDialogueEffects(): void {
        const effects = this.dialogueManager.consumeEffects();

        for (const effect of effects) {
            switch (effect.type) {
                case "startQuest":
                    this.questManager.startQuest(effect.value);
                    break;
                case "completeQuest":
                    this.questManager.completeQuest(effect.value);
                    break;
                case "giveMemory":
                    this.memoryManager.collect(effect.value);
                    break;
                case "unlockLocation":
                    this.worldManager.unlockLocation(effect.value);
                    break;
                case "setFlag":
                    this.setFlag(effect.value, true);
                    break;
                // "giveItem" and "openMinigame" require item data → handled in scene
                default:
                    break;
            }
        }
    }

    // ============================================================
    // Quest rewards integration
    // ============================================================

    applyQuestRewards(questId: string): void {
        const quest = this.questManager.getQuest(questId);
        if (!quest) return;

        let rewards: QuestReward[] = [];
        if (quest.isActive()) {
            rewards = this.questManager.completeQuest(questId);
        } else if (quest.isCompleted()) {
            rewards = quest.getRewards();
        }

        for (const reward of rewards) {
            switch (reward.type) {
                case "memory":
                    this.memoryManager.collect(reward.value);
                    break;
                case "unlock_location":
                    this.worldManager.unlockLocation(reward.value);
                    break;
                case "unlock_quest":
                    this.questManager.startQuest(reward.value);
                    break;
                // "item" and "xp" rewards handled in scene (need item registry)
                default:
                    break;
            }
        }
    }

    // ============================================================
    // Flags
    // ============================================================

    setFlag(key: string, value: boolean | number | string): void {
        this.flags.set(key, value);
    }

    getFlag(key: string): boolean | number | string | undefined {
        return this.flags.get(key);
    }

    hasFlag(key: string): boolean {
        return this.flags.has(key) && Boolean(this.flags.get(key));
    }

    // ============================================================
    // Save / Load
    // ============================================================

    save(playerX: number, playerY: number, sceneKey: string): boolean {
        return this.saveManager.save({
            player: {
                hp: 100, // TODO: wire to PlayerStats when integrated
                maxHp: 100,
                armor: 0,
                attack: 10,
                x: playerX,
                y: playerY,
                currentSceneKey: sceneKey,
            },
            quests: this.questManager.serialize(),
            inventory: this.inventoryManager.serialize(),
            memories: this.memoryManager.serialize(),
            locations: this.worldManager.serialize(),
            flags: Object.fromEntries(this.flags),
            challenges: this.challengeManager.serialize(),
            bossProgression: this.bossProgression.serialize(),
        });
    }

    load(itemLookup: Map<string, ItemData>): boolean {
        const data = this.saveManager.load();
        if (!data) return false;

        this.questManager.deserialize(data.quests);
        this.inventoryManager.deserialize(data.inventory, itemLookup);
        this.memoryManager.deserialize(data.memories);
        this.worldManager.deserialize(data.locations);

        for (const [key, value] of Object.entries(data.flags)) {
            this.flags.set(key, value);
        }

        if (data.challenges) {
            this.challengeManager.deserialize(data.challenges);
        }

        if (data.bossProgression) {
            this.bossProgression.deserialize(data.bossProgression);
        }

        return true;
    }

    // ============================================================
    // Private hooks
    // ============================================================

    private onQuestCompleted(questId: string): void {
        // Auto-apply quest rewards (memories, locations, follow-up quests)
        this.applyQuestRewards(questId);

        // Auto-unlock locations tied to quest
        for (const loc of this.worldManager.getLockedLocations()) {
            if (loc.unlockQuestId === questId) {
                this.worldManager.unlockLocation(loc.id);
            }
        }
    }

    private onChallengeWon(challenge: AcademicChallengeData): void {
        // Emit game events for quest objectives (e.g. defeat_enemy)
        this.onGameEvent("defeat_enemy", challenge.bossId);
        this.onGameEvent("defeat_enemy", challenge.id);

        // Collect reward memories
        if (challenge.rewardMemoryIds) {
            for (const memId of challenge.rewardMemoryIds) {
                this.memoryManager.collect(memId);
            }
        }

        // Unlock next location if specified
        if (challenge.unlockLocationId) {
            this.worldManager.unlockLocation(challenge.unlockLocationId);
        }

        // Unlock next quest if specified
        if (challenge.unlockQuestId) {
            this.questManager.startQuest(challenge.unlockQuestId);
        }
    }
}
