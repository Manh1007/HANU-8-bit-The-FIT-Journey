// ============================================================
// Inventory Item Types
// ============================================================

export type ItemType = "consumable" | "key_item" | "equipment" | "memory_fragment" | "document" | "misc";
export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export interface ItemData {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    rarity: ItemRarity;
    /** Can player stack multiple of this item */
    stackable: boolean;
    /** Max stack size (1 = not stackable) */
    maxStack: number;
    /** Icon/sprite key for UI (leave empty for now) */
    iconKey?: string;
    /** Optional effect when used (consumables) */
    useEffect?: { type: string; value: number };
}

export interface InventorySlot {
    item: ItemData;
    quantity: number;
}

// ============================================================
// InventoryManager
// ============================================================

export interface InventoryEventPayload {
    event: "item_added" | "item_removed" | "inventory_full";
    itemId: string;
    quantity: number;
}

export type InventoryEventListener = (payload: InventoryEventPayload) => void;

/**
 * InventoryManager — manages player inventory slots.
 *
 * - Stackable items merge into existing slots
 * - Non-stackable items get individual slots
 * - Max capacity can be configured
 */
export class InventoryManager {
    private slots: InventorySlot[] = [];
    private maxSlots: number;
    private listeners: InventoryEventListener[] = [];

    constructor(maxSlots = 20) {
        this.maxSlots = maxSlots;
    }

    // ============================================================
    // Add / Remove
    // ============================================================

    /**
     * Add item(s) to inventory.
     * Returns the actual quantity added (may be less if inventory full).
     */
    addItem(item: ItemData, quantity = 1): number {
        let remaining = quantity;

        // Try to stack into existing slot
        if (item.stackable) {
            for (const slot of this.slots) {
                if (slot.item.id === item.id && slot.quantity < item.maxStack) {
                    const space = item.maxStack - slot.quantity;
                    const toAdd = Math.min(remaining, space);
                    slot.quantity += toAdd;
                    remaining -= toAdd;
                    if (remaining === 0) break;
                }
            }
        }

        // Create new slots for remaining
        while (remaining > 0) {
            if (this.slots.length >= this.maxSlots) {
                this.emit({ event: "inventory_full", itemId: item.id, quantity: remaining });
                break;
            }

            const toAdd = item.stackable ? Math.min(remaining, item.maxStack) : 1;
            this.slots.push({ item, quantity: toAdd });
            remaining -= toAdd;
        }

        const added = quantity - remaining;
        if (added > 0) {
            this.emit({ event: "item_added", itemId: item.id, quantity: added });
        }

        return added;
    }

    /**
     * Remove item(s) from inventory.
     * Returns true if the full quantity was removed.
     */
    removeItem(itemId: string, quantity = 1): boolean {
        let remaining = quantity;

        for (let i = this.slots.length - 1; i >= 0 && remaining > 0; i--) {
            const slot = this.slots[i];
            if (slot.item.id !== itemId) continue;

            const toRemove = Math.min(remaining, slot.quantity);
            slot.quantity -= toRemove;
            remaining -= toRemove;

            if (slot.quantity === 0) {
                this.slots.splice(i, 1);
            }
        }

        const removed = quantity - remaining;
        if (removed > 0) {
            this.emit({ event: "item_removed", itemId, quantity: removed });
        }

        return remaining === 0;
    }

    // ============================================================
    // Queries
    // ============================================================

    hasItem(itemId: string, quantity = 1): boolean {
        return this.getQuantity(itemId) >= quantity;
    }

    getQuantity(itemId: string): number {
        return this.slots
            .filter((s) => s.item.id === itemId)
            .reduce((sum, s) => sum + s.quantity, 0);
    }

    getSlots(): InventorySlot[] {
        return this.slots.map((s) => ({ ...s }));
    }

    getSlotCount(): number {
        return this.slots.length;
    }

    isFull(): boolean {
        return this.slots.length >= this.maxSlots;
    }

    getItemsByType(type: ItemType): InventorySlot[] {
        return this.slots.filter((s) => s.item.type === type);
    }

    // ============================================================
    // Save / Load
    // ============================================================

    serialize(): { itemId: string; quantity: number }[] {
        return this.slots.map((s) => ({ itemId: s.item.id, quantity: s.quantity }));
    }

    /**
     * Restore from save. itemLookup: map of itemId → ItemData from game data.
     */
    deserialize(saved: { itemId: string; quantity: number }[], itemLookup: Map<string, ItemData>): void {
        this.slots = [];
        for (const { itemId, quantity } of saved) {
            const item = itemLookup.get(itemId);
            if (item) this.slots.push({ item, quantity });
        }
    }

    // ============================================================
    // Events
    // ============================================================

    addEventListener(listener: InventoryEventListener): void {
        this.listeners.push(listener);
    }

    removeEventListener(listener: InventoryEventListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    private emit(payload: InventoryEventPayload): void {
        for (const listener of this.listeners) {
            listener(payload);
        }
    }
}
