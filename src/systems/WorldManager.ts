// ============================================================
// Location / World Data (Data-Driven)
// ============================================================

export type LocationStatus = "locked" | "unlocked" | "visited" | "completed";

export interface LocationData {
    id: string;
    name: string;
    description: string;
    /** Scene key to load in Phaser */
    sceneKey: string;
    /** IDs of locations this is accessible from */
    connectedFrom: string[];
    /** Quest prerequisite to unlock */
    unlockQuestId?: string;
    /** Memory prerequisite to unlock */
    unlockMemoryId?: string;
    /** World-map coordinates for the UI */
    mapX?: number;
    mapY?: number;
}

// ============================================================
// WorldManager
// ============================================================

export interface WorldEventPayload {
    locationId: string;
    event: "location_unlocked" | "location_visited" | "location_completed";
}

export type WorldEventListener = (payload: WorldEventPayload) => void;

/**
 * WorldManager — manages location unlock and progression.
 *
 * Locations are defined as data and loaded at game start.
 * Unlock conditions (quest completion, memory collected) are
 * checked externally and `unlockLocation()` called as a result.
 */
export class WorldManager {
    private locations: Map<string, LocationData & { status: LocationStatus }> = new Map();
    private listeners: WorldEventListener[] = [];

    // ============================================================
    // Registry
    // ============================================================

    loadLocations(definitions: LocationData[]): void {
        for (const def of definitions) {
            this.locations.set(def.id, {
                ...def,
                status: def.connectedFrom.length === 0 ? "unlocked" : "locked",
            });
        }
    }

    getLocation(id: string) {
        return this.locations.get(id);
    }

    getAllLocations() {
        return Array.from(this.locations.values());
    }

    getUnlockedLocations() {
        return this.getAllLocations().filter(
            (l) => l.status === "unlocked" || l.status === "visited" || l.status === "completed"
        );
    }

    getLockedLocations() {
        return this.getAllLocations().filter((l) => l.status === "locked");
    }

    // ============================================================
    // Progression
    // ============================================================

    unlockLocation(locationId: string): boolean {
        const loc = this.locations.get(locationId);
        if (!loc || loc.status !== "locked") return false;

        loc.status = "unlocked";
        this.emit({ locationId, event: "location_unlocked" });
        return true;
    }

    visitLocation(locationId: string): boolean {
        const loc = this.locations.get(locationId);
        if (!loc || loc.status === "locked") return false;

        if (loc.status === "unlocked") {
            loc.status = "visited";
            this.emit({ locationId, event: "location_visited" });
        }
        return true;
    }

    completeLocation(locationId: string): boolean {
        const loc = this.locations.get(locationId);
        if (!loc || loc.status === "locked") return false;

        loc.status = "completed";
        this.emit({ locationId, event: "location_completed" });
        return true;
    }

    isUnlocked(locationId: string): boolean {
        const loc = this.locations.get(locationId);
        return loc ? loc.status !== "locked" : false;
    }

    canTravelTo(locationId: string): boolean {
        return this.isUnlocked(locationId);
    }

    getStatus(locationId: string): LocationStatus | undefined {
        return this.locations.get(locationId)?.status;
    }

    // ============================================================
    // Save / Load
    // ============================================================

    serialize(): Record<string, LocationStatus> {
        const result: Record<string, LocationStatus> = {};
        for (const [id, loc] of this.locations) {
            result[id] = loc.status;
        }
        return result;
    }

    deserialize(saved: Record<string, LocationStatus>): void {
        for (const [id, status] of Object.entries(saved)) {
            const loc = this.locations.get(id);
            if (loc) loc.status = status;
        }
    }

    // ============================================================
    // Events
    // ============================================================

    addEventListener(listener: WorldEventListener): void {
        this.listeners.push(listener);
    }

    removeEventListener(listener: WorldEventListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    private emit(payload: WorldEventPayload): void {
        for (const listener of this.listeners) {
            listener(payload);
        }
    }
}
