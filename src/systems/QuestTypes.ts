// ============================================================
// Quest Data Model (Data-Driven)
// ============================================================

export type QuestStatus = "locked" | "available" | "active" | "completed" | "failed";
export type QuestType = "main" | "side";

export interface QuestObjective {
    id: string;
    description: string;
    /** Type of objective to track */
    type: "talk_to_npc" | "defeat_enemy" | "collect_item" | "reach_location" | "complete_minigame";
    targetId: string;
    /** Required count (default 1) */
    required: number;
    current: number;
}

export interface QuestReward {
    type: "item" | "memory" | "unlock_location" | "unlock_quest" | "xp";
    value: string;
    amount?: number;
}

export interface QuestData {
    id: string;
    type: QuestType;
    title: string;
    description: string;
    /** Objectives that must ALL be completed */
    objectives: QuestObjective[];
    rewards: QuestReward[];
    /** Quest IDs that must be completed before this becomes available */
    prerequisites: string[];
    /** NPC ID that gives this quest */
    giverNpcId?: string;
    /** NPC ID to turn in the quest */
    turnInNpcId?: string;
}
