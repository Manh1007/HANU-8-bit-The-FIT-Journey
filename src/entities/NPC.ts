// ============================================================
// NPC Data Model
// ============================================================

export interface NPCInteractionCondition {
    type: "hasQuest" | "questComplete" | "hasItem" | "hasMemory" | "flag";
    value: string;
}

export interface NPCData {
    id: string;
    name: string;
    /** Dialogue entry-point ID */
    dialogueId: string;
    /** Optional quest this NPC starts */
    questId?: string;
    /** Position in world space */
    x: number;
    y: number;
    /** Optional condition to enable interaction */
    interactionCondition?: NPCInteractionCondition;
}

// ============================================================
// NPC Entity
// ============================================================

export class NPC {
    private readonly data: NPCData;
    private interactionEnabled = true;

    constructor(data: NPCData) {
        this.data = { ...data };
    }

    getId(): string { return this.data.id; }
    getName(): string { return this.data.name; }
    getDialogueId(): string { return this.data.dialogueId; }
    getQuestId(): string | undefined { return this.data.questId; }
    getX(): number { return this.data.x; }
    getY(): number { return this.data.y; }
    getCondition(): NPCInteractionCondition | undefined {
        return this.data.interactionCondition;
    }

    isInteractionEnabled(): boolean {
        return this.interactionEnabled;
    }

    setInteractionEnabled(enabled: boolean): void {
        this.interactionEnabled = enabled;
    }

    distanceTo(px: number, py: number): number {
        const dx = this.data.x - px;
        const dy = this.data.y - py;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
