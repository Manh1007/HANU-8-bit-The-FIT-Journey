import type { QuestData, QuestObjective, QuestReward, QuestStatus } from "./QuestTypes";

// ============================================================
// Live quest instance (runtime state)
// ============================================================

export class QuestInstance {
    private readonly data: QuestData;
    private status: QuestStatus;
    private objectives: QuestObjective[];

    constructor(data: QuestData, initialStatus: QuestStatus = "locked") {
        this.data = data;
        this.status = initialStatus;
        // Deep clone objectives so progress is per-instance
        this.objectives = data.objectives.map((o) => ({ ...o, current: 0 }));
    }

    getId(): string { return this.data.id; }
    getTitle(): string { return this.data.title; }
    getDescription(): string { return this.data.description; }
    getType() { return this.data.type; }
    getStatus(): QuestStatus { return this.status; }
    getPrerequisites(): string[] { return this.data.prerequisites; }
    getRewards(): QuestReward[] { return this.data.rewards; }
    getGiverNpcId(): string | undefined { return this.data.giverNpcId; }
    getTurnInNpcId(): string | undefined { return this.data.turnInNpcId; }

    isLocked(): boolean { return this.status === "locked"; }
    isAvailable(): boolean { return this.status === "available"; }
    isActive(): boolean { return this.status === "active"; }
    isCompleted(): boolean { return this.status === "completed"; }
    isFailed(): boolean { return this.status === "failed"; }

    setStatus(status: QuestStatus): void {
        this.status = status;
    }

    // ============================================================
    // Objective tracking
    // ============================================================

    getObjectives(): QuestObjective[] {
        return this.objectives.map((o) => ({ ...o }));
    }

    /**
     * Advance progress on an objective by type+targetId.
     * Returns true if any objective was updated.
     */
    advanceObjective(type: QuestObjective["type"], targetId: string, amount = 1): boolean {
        let updated = false;

        for (const obj of this.objectives) {
            if (obj.type === type && obj.targetId === targetId && obj.current < obj.required) {
                obj.current = Math.min(obj.current + amount, obj.required);
                updated = true;
            }
        }

        return updated;
    }

    /**
     * Check if all objectives are complete.
     */
    areAllObjectivesComplete(): boolean {
        return this.objectives.every((o) => o.current >= o.required);
    }

    /**
     * Completion percentage (0–100).
     */
    getCompletionPercent(): number {
        if (this.objectives.length === 0) return 100;
        const total = this.objectives.reduce((s, o) => s + o.required, 0);
        const done = this.objectives.reduce((s, o) => s + o.current, 0);
        return Math.round((done / total) * 100);
    }
}

// ============================================================
// QuestManager
// ============================================================

export interface QuestEventPayload {
    questId: string;
    event: "quest_available" | "quest_started" | "quest_objective_updated" | "quest_completed" | "quest_failed";
    data?: Record<string, unknown>;
}

export type QuestEventListener = (payload: QuestEventPayload) => void;

/**
 * QuestManager — manages all quest instances and tracks progress.
 *
 * - Loads quest definitions (data-driven)
 * - Tracks active/completed quests
 * - Advances objectives on game events
 * - Unlocks dependent quests when prerequisites are met
 * - Emits events for UI and save/load systems
 */
export class QuestManager {
    private quests: Map<string, QuestInstance> = new Map();
    private listeners: QuestEventListener[] = [];

    // ============================================================
    // Registry
    // ============================================================

    /**
     * Register quest definitions. Call once at game start.
     */
    loadQuests(definitions: QuestData[]): void {
        for (const def of definitions) {
            const status: QuestStatus =
                def.prerequisites.length === 0 ? "available" : "locked";
            this.quests.set(def.id, new QuestInstance(def, status));
        }
    }

    getQuest(questId: string): QuestInstance | undefined {
        return this.quests.get(questId);
    }

    getAllQuests(): QuestInstance[] {
        return Array.from(this.quests.values());
    }

    getActiveQuests(): QuestInstance[] {
        return this.getAllQuests().filter((q) => q.isActive());
    }

    getAvailableQuests(): QuestInstance[] {
        return this.getAllQuests().filter((q) => q.isAvailable());
    }

    getCompletedQuests(): QuestInstance[] {
        return this.getAllQuests().filter((q) => q.isCompleted());
    }

    // ============================================================
    // Quest lifecycle
    // ============================================================

    /**
     * Start a quest (move from available → active).
     */
    startQuest(questId: string): boolean {
        const quest = this.quests.get(questId);
        if (!quest || !quest.isAvailable()) return false;

        quest.setStatus("active");
        this.emit({ questId, event: "quest_started" });
        return true;
    }

    /**
     * Complete a quest (move from active → completed) and unlock dependents.
     * Returns rewards for the caller to apply.
     */
    completeQuest(questId: string): QuestReward[] {
        const quest = this.quests.get(questId);
        if (!quest || !quest.isActive()) return [];

        quest.setStatus("completed");
        this.unlockDependents(questId);
        this.emit({ questId, event: "quest_completed" });

        return quest.getRewards();
    }

    /**
     * Fail a quest.
     */
    failQuest(questId: string): boolean {
        const quest = this.quests.get(questId);
        if (!quest || !quest.isActive()) return false;

        quest.setStatus("failed");
        this.emit({ questId, event: "quest_failed" });
        return true;
    }

    // ============================================================
    // Objective tracking
    // ============================================================

    /**
     * Notify manager that a game event occurred (enemy killed, NPC talked to, etc.).
     * Updates all active quests' matching objectives.
     */
    onEvent(type: QuestObjective["type"], targetId: string, amount = 1): void {
        for (const quest of this.getActiveQuests()) {
            const updated = quest.advanceObjective(type, targetId, amount);

            if (updated) {
                this.emit({ questId: quest.getId(), event: "quest_objective_updated" });

                // Auto-complete when all objectives done
                if (quest.areAllObjectivesComplete()) {
                    // Only auto-complete if no turn-in NPC required
                    if (!quest.getTurnInNpcId()) {
                        this.completeQuest(quest.getId());
                    }
                }
            }
        }
    }

    // ============================================================
    // Condition helpers (used by DialogueManager evaluator)
    // ============================================================

    isQuestComplete(questId: string): boolean {
        return this.quests.get(questId)?.isCompleted() ?? false;
    }

    isQuestActive(questId: string): boolean {
        return this.quests.get(questId)?.isActive() ?? false;
    }

    hasQuest(questId: string): boolean {
        const q = this.quests.get(questId);
        return q?.isActive() || q?.isCompleted() || false;
    }

    // ============================================================
    // Events
    // ============================================================

    addEventListener(listener: QuestEventListener): void {
        this.listeners.push(listener);
    }

    removeEventListener(listener: QuestEventListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    // ============================================================
    // Save / Load support
    // ============================================================

    /**
     * Serialize quest progress for save system.
     */
    serialize(): Record<string, { status: QuestStatus; objectives: { id: string; current: number }[] }> {
        const result: Record<string, { status: QuestStatus; objectives: { id: string; current: number }[] }> = {};

        for (const [id, quest] of this.quests) {
            result[id] = {
                status: quest.getStatus(),
                objectives: quest.getObjectives().map((o) => ({ id: o.id, current: o.current })),
            };
        }

        return result;
    }

    /**
     * Restore quest progress from saved data.
     */
    deserialize(saved: Record<string, { status: QuestStatus; objectives: { id: string; current: number }[] }>): void {
        for (const [id, savedQuest] of Object.entries(saved)) {
            const quest = this.quests.get(id);
            if (!quest) continue;

            quest.setStatus(savedQuest.status);

            for (const savedObj of savedQuest.objectives) {
                quest.advanceObjective("talk_to_npc", savedObj.id, 0); // no-op to find obj
                // Directly patch via objective advance with correct amount
                const objectives = quest.getObjectives();
                const obj = objectives.find((o) => o.id === savedObj.id);
                if (obj) {
                    quest.advanceObjective(obj.type, obj.targetId, savedObj.current - obj.current);
                }
            }
        }
    }

    // ============================================================
    // Private
    // ============================================================

    private emit(payload: QuestEventPayload): void {
        for (const listener of this.listeners) {
            listener(payload);
        }
    }

    private unlockDependents(_completedQuestId: string): void {
        for (const quest of this.getAllQuests()) {
            if (!quest.isLocked()) continue;

            const prereqs = quest.getPrerequisites();
            const allMet = prereqs.every((prereqId) => this.isQuestComplete(prereqId));

            if (allMet) {
                quest.setStatus("available");
                this.emit({ questId: quest.getId(), event: "quest_available" });
            }
        }
    }
}
