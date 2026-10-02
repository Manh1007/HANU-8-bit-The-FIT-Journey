import { NPC, type NPCData } from "../entities/NPC";

export interface InteractionResult {
    success: boolean;
    npc: NPC | null;
    dialogueId: string | null;
    questId: string | null;
    reason?: string;
}

/**
 * NPCManager — manages NPC registry and player interaction logic.
 *
 * No Phaser dependency. Position-based interaction detection.
 * Works alongside the existing InteractionManager (which handles
 * Tiled-based entrance interactions) for NPC-specific interactions.
 */
export class NPCManager {
    private npcs: Map<string, NPC> = new Map();

    /** Distance at which player can interact with an NPC */
    private interactionRange = 50;

    constructor(interactionRange = 50) {
        this.interactionRange = interactionRange;
    }

    // ============================================================
    // Registry
    // ============================================================

    register(data: NPCData): NPC {
        const npc = new NPC(data);
        this.npcs.set(data.id, npc);
        return npc;
    }

    get(npcId: string): NPC | undefined {
        return this.npcs.get(npcId);
    }

    getAll(): NPC[] {
        return Array.from(this.npcs.values());
    }

    remove(npcId: string): boolean {
        return this.npcs.delete(npcId);
    }

    clear(): void {
        this.npcs.clear();
    }

    count(): number {
        return this.npcs.size;
    }

    // ============================================================
    // Proximity detection
    // ============================================================

    /**
     * Get all NPCs within interaction range of the player.
     */
    getNPCsInRange(px: number, py: number): NPC[] {
        return this.getAll().filter(
            (npc) => npc.distanceTo(px, py) <= this.interactionRange
        );
    }

    /**
     * Get the nearest NPC to the player position.
     * Returns null if no NPCs are in range.
     */
    getNearestNPC(px: number, py: number): NPC | null {
        let nearest: NPC | null = null;
        let minDist = this.interactionRange + 1;

        for (const npc of this.getAll()) {
            const dist = npc.distanceTo(px, py);
            if (dist <= this.interactionRange && dist < minDist) {
                minDist = dist;
                nearest = npc;
            }
        }

        return nearest;
    }

    // ============================================================
    // Interaction
    // ============================================================

    /**
     * Attempt to interact with the nearest NPC.
     * Condition checking is delegated to the caller (GameState/QuestManager).
     * Returns the dialogue ID and quest ID to open.
     */
    interact(px: number, py: number): InteractionResult {
        const npc = this.getNearestNPC(px, py);

        if (!npc) {
            return {
                success: false,
                npc: null,
                dialogueId: null,
                questId: null,
                reason: "no_npc_in_range",
            };
        }

        if (!npc.isInteractionEnabled()) {
            return {
                success: false,
                npc,
                dialogueId: null,
                questId: null,
                reason: "interaction_disabled",
            };
        }

        return {
            success: true,
            npc,
            dialogueId: npc.getDialogueId(),
            questId: npc.getQuestId() ?? null,
        };
    }

    /**
     * Interact with a specific NPC by ID (for scripted interactions).
     */
    interactById(npcId: string): InteractionResult {
        const npc = this.get(npcId);

        if (!npc) {
            return {
                success: false,
                npc: null,
                dialogueId: null,
                questId: null,
                reason: "npc_not_found",
            };
        }

        if (!npc.isInteractionEnabled()) {
            return {
                success: false,
                npc,
                dialogueId: null,
                questId: null,
                reason: "interaction_disabled",
            };
        }

        return {
            success: true,
            npc,
            dialogueId: npc.getDialogueId(),
            questId: npc.getQuestId() ?? null,
        };
    }
}
