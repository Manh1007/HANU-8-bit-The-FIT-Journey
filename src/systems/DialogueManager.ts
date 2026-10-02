import type {
    DialogueTree,
    DialogueNode,
    DialogueChoice,
    DialogueEffect,
    DialogueCondition,
} from "./DialogueTypes";

export type DialogueManagerStatus =
    | "idle"
    | "active"
    | "waiting_for_choice"
    | "finished";

export interface DialogueState {
    status: DialogueManagerStatus;
    currentNode: DialogueNode | null;
    availableChoices: DialogueChoice[];
    pendingEffects: DialogueEffect[];
}

/**
 * Condition evaluator function — provided by the game (GameState / QuestManager).
 * Returns true when the condition is satisfied.
 */
export type ConditionEvaluator = (condition: DialogueCondition) => boolean;

/**
 * DialogueManager — stateful dialogue runner.
 *
 * Executes a data-driven DialogueTree step by step.
 * - `start(tree)` begins the dialogue at the tree's startNodeId.
 * - `advance()` moves to the next node (when no choices are pending).
 * - `selectChoice(choiceId)` picks a player choice and advances.
 * - Each `advance()` / `selectChoice()` returns the new DialogueState.
 *
 * Condition evaluation is delegated to an external ConditionEvaluator
 * so this class has zero dependency on GameState.
 */
export class DialogueManager {
    private trees: Map<string, DialogueTree> = new Map();
    private nodeMap: Map<string, DialogueNode> = new Map();

    private status: DialogueManagerStatus = "idle";
    private currentNode: DialogueNode | null = null;
    private pendingEffects: DialogueEffect[] = [];

    private evaluator: ConditionEvaluator;

    constructor(evaluator?: ConditionEvaluator) {
        // Default evaluator: always true (no conditions block progress)
        this.evaluator = evaluator ?? (() => true);
    }

    // ============================================================
    // Tree registry
    // ============================================================

    /**
     * Register a dialogue tree. Builds an internal node lookup map.
     */
    registerTree(tree: DialogueTree): void {
        this.trees.set(tree.id, tree);
        for (const node of tree.nodes) {
            this.nodeMap.set(node.id, node);
        }
    }

    getTree(treeId: string): DialogueTree | undefined {
        return this.trees.get(treeId);
    }

    // ============================================================
    // Dialogue control
    // ============================================================

    /**
     * Start a dialogue tree by ID.
     */
    start(treeId: string): DialogueState {
        const tree = this.trees.get(treeId);

        if (!tree) {
            this.status = "idle";
            return this.buildState();
        }

        const startNode = this.nodeMap.get(tree.startNodeId);

        if (!startNode) {
            this.status = "idle";
            return this.buildState();
        }

        this.status = "active";
        this.pendingEffects = [];
        return this.enterNode(startNode);
    }

    /**
     * Advance to the next node.
     * Only valid when status is "active" (no choices pending).
     */
    advance(): DialogueState {
        if (this.status !== "active" || !this.currentNode) {
            return this.buildState();
        }

        const nextId = this.currentNode.nextNodeId;

        if (!nextId) {
            this.status = "finished";
            this.currentNode = null;
            return this.buildState();
        }

        const nextNode = this.nodeMap.get(nextId);

        if (!nextNode) {
            this.status = "finished";
            this.currentNode = null;
            return this.buildState();
        }

        return this.enterNode(nextNode);
    }

    /**
     * Select a player choice by choice ID.
     * Only valid when status is "waiting_for_choice".
     */
    selectChoice(choiceId: string): DialogueState {
        if (this.status !== "waiting_for_choice" || !this.currentNode) {
            return this.buildState();
        }

        const choices = this.getAvailableChoices(this.currentNode);
        const choice = choices.find((c) => c.id === choiceId);

        if (!choice) {
            return this.buildState();
        }

        // Collect effects from the choice
        if (choice.effects) {
            this.pendingEffects.push(...choice.effects);
        }

        if (!choice.nextNodeId) {
            this.status = "finished";
            this.currentNode = null;
            return this.buildState();
        }

        const nextNode = this.nodeMap.get(choice.nextNodeId);

        if (!nextNode) {
            this.status = "finished";
            this.currentNode = null;
            return this.buildState();
        }

        return this.enterNode(nextNode);
    }

    /**
     * End the dialogue regardless of current state.
     */
    end(): void {
        this.status = "idle";
        this.currentNode = null;
        this.pendingEffects = [];
    }

    // ============================================================
    // State
    // ============================================================

    getStatus(): DialogueManagerStatus {
        return this.status;
    }

    isActive(): boolean {
        return this.status === "active" || this.status === "waiting_for_choice";
    }

    getState(): DialogueState {
        return this.buildState();
    }

    /**
     * Consume and clear the pending effects list.
     * The caller (GameState) should process these after each advance.
     */
    consumeEffects(): DialogueEffect[] {
        const effects = [...this.pendingEffects];
        this.pendingEffects = [];
        return effects;
    }

    // ============================================================
    // Private helpers
    // ============================================================

    private enterNode(node: DialogueNode): DialogueState {
        this.currentNode = node;

        // Collect node-level effects
        if (node.effects) {
            this.pendingEffects.push(...node.effects);
        }

        const choices = this.getAvailableChoices(node);

        if (choices.length > 0) {
            this.status = "waiting_for_choice";
        } else {
            this.status = "active";
        }

        return this.buildState();
    }

    private getAvailableChoices(node: DialogueNode): DialogueChoice[] {
        if (!node.choices || node.choices.length === 0) {
            return [];
        }

        return node.choices.filter((choice) => {
            if (!choice.condition) return true;
            return this.evaluator(choice.condition);
        });
    }

    private buildState(): DialogueState {
        const availableChoices = this.currentNode
            ? this.getAvailableChoices(this.currentNode)
            : [];

        return {
            status: this.status,
            currentNode: this.currentNode,
            availableChoices,
            pendingEffects: [...this.pendingEffects],
        };
    }
}
