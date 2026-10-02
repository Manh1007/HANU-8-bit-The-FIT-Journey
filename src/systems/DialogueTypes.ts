// ============================================================
// Dialogue Data Types
// ============================================================

/**
 * A condition that must be met to show a node or choice.
 */
export interface DialogueCondition {
    type:
        | "hasQuest"
        | "questComplete"
        | "hasItem"
        | "hasMemory"
        | "flag";
    value: string;
}

/**
 * An effect triggered when a choice is selected or a node is reached.
 */
export type DialogueEffectType =
    | "startQuest"
    | "completeQuest"
    | "giveItem"
    | "giveMemory"
    | "unlockLocation"
    | "setFlag"
    | "openMinigame"
    | "hint";

export interface DialogueEffect {
    type: DialogueEffectType;
    value: string;
}

/**
 * A choice the player can select within a dialogue node.
 */
export interface DialogueChoice {
    id: string;
    text: string;
    /** ID of the next dialogue node to load when this choice is selected */
    nextNodeId: string | null;
    /** Optional condition to show this choice */
    condition?: DialogueCondition;
    /** Effects triggered when this choice is selected */
    effects?: DialogueEffect[];
}

/**
 * A single node in a dialogue tree.
 */
export interface DialogueNode {
    id: string;
    /** Who is speaking */
    speaker: string;
    /** The dialogue text */
    text: string;
    /** ID of the next node (null = end of branch) */
    nextNodeId: string | null;
    /** Player choices (if any). If present, nextNodeId is ignored until player picks. */
    choices?: DialogueChoice[];
    /** Condition to reach this node */
    condition?: DialogueCondition;
    /** Effects that fire when this node is displayed */
    effects?: DialogueEffect[];
}

/**
 * A complete dialogue tree (data-driven, loaded from JSON).
 */
export interface DialogueTree {
    id: string;
    startNodeId: string;
    nodes: DialogueNode[];
}
