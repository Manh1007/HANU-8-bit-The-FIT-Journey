import { describe, expect, test, beforeEach } from "vitest";
import { NPC, type NPCData } from "../entities/NPC";
import { NPCManager } from "../systems/NPCManager";
import { DialogueManager } from "../systems/DialogueManager";
import type { DialogueTree, DialogueCondition } from "../systems/DialogueTypes";

// ============================================================
// NPC Entity
// ============================================================

describe("NPC — entity", () => {
    const data: NPCData = {
        id: "npc1",
        name: "Thầy Minh",
        dialogueId: "dialogue_minh_01",
        questId: "quest_01",
        x: 100,
        y: 200,
    };

    test("should store basic NPC data", () => {
        const npc = new NPC(data);
        expect(npc.getId()).toBe("npc1");
        expect(npc.getName()).toBe("Thầy Minh");
        expect(npc.getDialogueId()).toBe("dialogue_minh_01");
        expect(npc.getQuestId()).toBe("quest_01");
        expect(npc.getX()).toBe(100);
        expect(npc.getY()).toBe(200);
    });

    test("should be interactable by default", () => {
        const npc = new NPC(data);
        expect(npc.isInteractionEnabled()).toBe(true);
    });

    test("should be disableable", () => {
        const npc = new NPC(data);
        npc.setInteractionEnabled(false);
        expect(npc.isInteractionEnabled()).toBe(false);
    });

    test("should calculate distance correctly", () => {
        const npc = new NPC(data); // at (100, 200)
        expect(npc.distanceTo(100, 200)).toBe(0);
        expect(npc.distanceTo(100, 250)).toBe(50);
        expect(npc.distanceTo(160, 200)).toBe(60);
    });

    test("should handle NPC without questId", () => {
        const npc = new NPC({ ...data, questId: undefined });
        expect(npc.getQuestId()).toBeUndefined();
    });
});

// ============================================================
// NPCManager
// ============================================================

describe("NPCManager", () => {
    let manager: NPCManager;

    beforeEach(() => {
        manager = new NPCManager(50);
    });

    test("should start empty", () => {
        expect(manager.count()).toBe(0);
    });

    test("should register an NPC", () => {
        manager.register({
            id: "npc1",
            name: "NPC 1",
            dialogueId: "d1",
            x: 0,
            y: 0,
        });
        expect(manager.count()).toBe(1);
        expect(manager.get("npc1")).not.toBeUndefined();
    });

    test("should get all NPCs", () => {
        manager.register({ id: "npc1", name: "A", dialogueId: "d1", x: 0, y: 0 });
        manager.register({ id: "npc2", name: "B", dialogueId: "d2", x: 100, y: 0 });
        expect(manager.getAll()).toHaveLength(2);
    });

    test("should remove an NPC", () => {
        manager.register({ id: "npc1", name: "A", dialogueId: "d1", x: 0, y: 0 });
        manager.remove("npc1");
        expect(manager.count()).toBe(0);
    });

    test("should detect NPC within interaction range", () => {
        manager.register({ id: "npc1", name: "A", dialogueId: "d1", x: 30, y: 0 });
        const inRange = manager.getNPCsInRange(0, 0); // range=50
        expect(inRange).toHaveLength(1);
    });

    test("should not detect NPC outside interaction range", () => {
        manager.register({ id: "npc1", name: "A", dialogueId: "d1", x: 200, y: 0 });
        const inRange = manager.getNPCsInRange(0, 0);
        expect(inRange).toHaveLength(0);
    });

    test("should get nearest NPC", () => {
        manager.register({ id: "near", name: "Near", dialogueId: "d1", x: 20, y: 0 });
        manager.register({ id: "far", name: "Far", dialogueId: "d2", x: 40, y: 0 });
        const nearest = manager.getNearestNPC(0, 0);
        expect(nearest?.getId()).toBe("near");
    });

    test("should return null when no NPC in range", () => {
        manager.register({ id: "npc1", name: "A", dialogueId: "d1", x: 999, y: 0 });
        expect(manager.getNearestNPC(0, 0)).toBeNull();
    });

    test("should interact with nearest NPC successfully", () => {
        manager.register({
            id: "npc1",
            name: "A",
            dialogueId: "dlg_a",
            questId: "quest_a",
            x: 30,
            y: 0,
        });
        const result = manager.interact(0, 0);
        expect(result.success).toBe(true);
        expect(result.dialogueId).toBe("dlg_a");
        expect(result.questId).toBe("quest_a");
    });

    test("should fail interaction when no NPC in range", () => {
        const result = manager.interact(0, 0);
        expect(result.success).toBe(false);
        expect(result.reason).toBe("no_npc_in_range");
    });

    test("should fail interaction when NPC is disabled", () => {
        const npc = manager.register({
            id: "npc1", name: "A", dialogueId: "d1", x: 30, y: 0,
        });
        npc.setInteractionEnabled(false);
        const result = manager.interact(0, 0);
        expect(result.success).toBe(false);
        expect(result.reason).toBe("interaction_disabled");
    });

    test("should interact by specific NPC ID", () => {
        manager.register({ id: "npc1", name: "A", dialogueId: "dlg_a", x: 999, y: 0 });
        const result = manager.interactById("npc1"); // ignores range
        expect(result.success).toBe(true);
        expect(result.dialogueId).toBe("dlg_a");
    });
});

// ============================================================
// DialogueManager — linear dialogue
// ============================================================

const LINEAR_TREE: DialogueTree = {
    id: "dlg_linear",
    startNodeId: "n1",
    nodes: [
        { id: "n1", speaker: "Thầy", text: "Xin chào!", nextNodeId: "n2" },
        { id: "n2", speaker: "Thầy", text: "Bạn có khỏe không?", nextNodeId: null },
    ],
};

describe("DialogueManager — linear dialogue", () => {
    let manager: DialogueManager;

    beforeEach(() => {
        manager = new DialogueManager();
        manager.registerTree(LINEAR_TREE);
    });

    test("should start in idle state", () => {
        expect(manager.getStatus()).toBe("idle");
        expect(manager.isActive()).toBe(false);
    });

    test("should start dialogue and show first node", () => {
        const state = manager.start("dlg_linear");
        expect(state.status).toBe("active");
        expect(state.currentNode?.id).toBe("n1");
        expect(state.currentNode?.text).toBe("Xin chào!");
    });

    test("should advance to second node", () => {
        manager.start("dlg_linear");
        const state = manager.advance();
        expect(state.currentNode?.id).toBe("n2");
        expect(state.currentNode?.text).toBe("Bạn có khỏe không?");
    });

    test("should finish after last node", () => {
        manager.start("dlg_linear");
        manager.advance();
        const state = manager.advance(); // past the last node
        expect(state.status).toBe("finished");
        expect(state.currentNode).toBeNull();
    });

    test("should return idle for unknown tree ID", () => {
        const state = manager.start("nonexistent");
        expect(state.status).toBe("idle");
    });
});

// ============================================================
// DialogueManager — branching choices
// ============================================================

const BRANCHING_TREE: DialogueTree = {
    id: "dlg_branch",
    startNodeId: "n1",
    nodes: [
        {
            id: "n1",
            speaker: "Thầy",
            text: "Bạn muốn học gì?",
            nextNodeId: null,
            choices: [
                { id: "c1", text: "Lập trình", nextNodeId: "n_prog" },
                { id: "c2", text: "Toán học", nextNodeId: "n_math" },
            ],
        },
        {
            id: "n_prog",
            speaker: "Thầy",
            text: "Lập trình rất thú vị!",
            nextNodeId: null,
        },
        {
            id: "n_math",
            speaker: "Thầy",
            text: "Toán học là nền tảng!",
            nextNodeId: null,
        },
    ],
};

describe("DialogueManager — branching choices", () => {
    let manager: DialogueManager;

    beforeEach(() => {
        manager = new DialogueManager();
        manager.registerTree(BRANCHING_TREE);
    });

    test("should show waiting_for_choice when choices present", () => {
        const state = manager.start("dlg_branch");
        expect(state.status).toBe("waiting_for_choice");
        expect(state.availableChoices).toHaveLength(2);
    });

    test("should advance to correct branch when choice selected", () => {
        manager.start("dlg_branch");
        const state = manager.selectChoice("c1");
        expect(state.currentNode?.id).toBe("n_prog");
        expect(state.currentNode?.text).toBe("Lập trình rất thú vị!");
    });

    test("should branch to math node when c2 selected", () => {
        manager.start("dlg_branch");
        const state = manager.selectChoice("c2");
        expect(state.currentNode?.id).toBe("n_math");
    });

    test("should not advance when waiting for choice", () => {
        manager.start("dlg_branch");
        // advance() should not work when waiting_for_choice
        const state = manager.advance();
        expect(state.status).toBe("waiting_for_choice");
    });
});

// ============================================================
// DialogueManager — effects
// ============================================================

const EFFECTS_TREE: DialogueTree = {
    id: "dlg_effects",
    startNodeId: "n1",
    nodes: [
        {
            id: "n1",
            speaker: "Thầy",
            text: "Nhiệm vụ đầu tiên của bạn...",
            nextNodeId: null,
            effects: [{ type: "startQuest", value: "quest_01" }],
            choices: [
                {
                    id: "c_accept",
                    text: "Tôi đồng ý",
                    nextNodeId: null,
                    effects: [{ type: "giveItem", value: "map_001" }],
                },
            ],
        },
    ],
};

describe("DialogueManager — effects", () => {
    let manager: DialogueManager;

    beforeEach(() => {
        manager = new DialogueManager();
        manager.registerTree(EFFECTS_TREE);
    });

    test("should collect node-level effects on enter", () => {
        const state = manager.start("dlg_effects");
        expect(state.pendingEffects).toHaveLength(1);
        expect(state.pendingEffects[0].type).toBe("startQuest");
        expect(state.pendingEffects[0].value).toBe("quest_01");
    });

    test("should collect choice-level effects on select", () => {
        manager.start("dlg_effects");
        manager.consumeEffects(); // clear node effects
        const state = manager.selectChoice("c_accept");
        expect(state.pendingEffects).toHaveLength(1);
        expect(state.pendingEffects[0].type).toBe("giveItem");
    });

    test("consumeEffects should clear pending effects", () => {
        manager.start("dlg_effects");
        expect(manager.consumeEffects()).toHaveLength(1);
        expect(manager.consumeEffects()).toHaveLength(0);
    });
});

// ============================================================
// DialogueManager — conditional choices
// ============================================================

const CONDITIONAL_TREE: DialogueTree = {
    id: "dlg_conditional",
    startNodeId: "n1",
    nodes: [
        {
            id: "n1",
            speaker: "NPC",
            text: "Chào!",
            nextNodeId: null,
            choices: [
                {
                    id: "c_quest",
                    text: "Nhận nhiệm vụ",
                    nextNodeId: null,
                    condition: { type: "hasQuest", value: "quest_01" },
                },
                {
                    id: "c_normal",
                    text: "Tạm biệt",
                    nextNodeId: null,
                },
            ],
        },
    ],
};

describe("DialogueManager — conditional choices", () => {
    test("should hide choice when condition fails", () => {
        const manager = new DialogueManager(() => false); // always deny
        manager.registerTree(CONDITIONAL_TREE);
        const state = manager.start("dlg_conditional");
        // Only "Tạm biệt" (no condition) should appear
        expect(state.availableChoices).toHaveLength(1);
        expect(state.availableChoices[0].id).toBe("c_normal");
    });

    test("should show all choices when condition passes", () => {
        const manager = new DialogueManager(() => true); // always allow
        manager.registerTree(CONDITIONAL_TREE);
        const state = manager.start("dlg_conditional");
        expect(state.availableChoices).toHaveLength(2);
    });

    test("should evaluate specific condition type", () => {
        const evaluator = (cond: DialogueCondition) =>
            cond.type === "hasQuest" && cond.value === "quest_01";
        const manager = new DialogueManager(evaluator);
        manager.registerTree(CONDITIONAL_TREE);
        const state = manager.start("dlg_conditional");
        expect(state.availableChoices).toHaveLength(2);
    });
});
