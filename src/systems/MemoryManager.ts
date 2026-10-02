// ============================================================
// Memory Fragment (Mảnh ghép Kỷ niệm) Data
// ============================================================

export type MemoryCategory =
    | "founding"      // Lịch sử thành lập FIT/HANU
    | "milestone"     // Cột mốc quan trọng
    | "achievement"   // Thành tích sinh viên/giảng viên
    | "campus"        // Hình ảnh khuôn viên
    | "culture"       // Văn hóa FIT
    | "technology";   // Công nghệ / nghiên cứu

export interface MemoryData {
    id: string;
    title: string;
    description: string;
    year?: number;           // Year this memory is from (leave 0 = unknown)
    category: MemoryCategory;
    /** Image/sprite key for display (fill later) */
    imageKey?: string;
    /** Optional audio clip key */
    audioKey?: string;
    /** NPC or location ID that reveals this memory */
    sourceId?: string;
    /** Quest ID that reveals this memory */
    questId?: string;
    /** Hint text shown before memory is unlocked */
    hint: string;
}

// ============================================================
// MemoryManager — "Mảnh ghép Kỷ niệm" system
// ============================================================

export interface MemoryEventPayload {
    memoryId: string;
    event: "memory_collected" | "memory_viewed";
}

export type MemoryEventListener = (payload: MemoryEventPayload) => void;

/**
 * MemoryManager — manages the collection of FIT/HANU memory fragments.
 *
 * Memories are clues about the 20-year history of FIT HANU.
 * They are unlocked through gameplay (NPC interaction, quest completion,
 * exploration) and displayed in a "Memory Gallery" UI.
 */
export class MemoryManager {
    private memories: Map<string, MemoryData> = new Map();
    private collected: Set<string> = new Set();
    private viewed: Set<string> = new Set();
    private listeners: MemoryEventListener[] = [];

    // ============================================================
    // Registry
    // ============================================================

    loadMemories(definitions: MemoryData[]): void {
        for (const def of definitions) {
            this.memories.set(def.id, def);
        }
    }

    registerMemory(data: MemoryData): void {
        this.memories.set(data.id, data);
    }

    getMemory(id: string): MemoryData | undefined {
        return this.memories.get(id);
    }

    getAllMemories(): MemoryData[] {
        return Array.from(this.memories.values());
    }

    // ============================================================
    // Collection
    // ============================================================

    /**
     * Collect (unlock) a memory fragment.
     * Returns false if already collected.
     */
    collect(memoryId: string): boolean {
        if (this.collected.has(memoryId)) return false;
        if (!this.memories.has(memoryId)) return false;

        this.collected.add(memoryId);
        this.emit({ memoryId, event: "memory_collected" });
        return true;
    }

    isCollected(memoryId: string): boolean {
        return this.collected.has(memoryId);
    }

    getCollected(): MemoryData[] {
        return Array.from(this.collected)
            .map((id) => this.memories.get(id)!)
            .filter(Boolean);
    }

    getUncollected(): MemoryData[] {
        return this.getAllMemories().filter((m) => !this.collected.has(m.id));
    }

    getCollectedCount(): number {
        return this.collected.size;
    }

    getTotalCount(): number {
        return this.memories.size;
    }

    getCompletionPercent(): number {
        if (this.memories.size === 0) return 0;
        return Math.round((this.collected.size / this.memories.size) * 100);
    }

    // ============================================================
    // Viewing (gallery)
    // ============================================================

    viewMemory(memoryId: string): boolean {
        if (!this.collected.has(memoryId)) return false;
        this.viewed.add(memoryId);
        this.emit({ memoryId, event: "memory_viewed" });
        return true;
    }

    isViewed(memoryId: string): boolean {
        return this.viewed.has(memoryId);
    }

    getUnviewedCount(): number {
        return this.collected.size - this.viewed.size;
    }

    getByCategory(category: MemoryCategory): MemoryData[] {
        return this.getCollected().filter((m) => m.category === category);
    }

    // ============================================================
    // Save / Load
    // ============================================================

    serialize(): { collected: string[]; viewed: string[] } {
        return {
            collected: Array.from(this.collected),
            viewed: Array.from(this.viewed),
        };
    }

    deserialize(saved: { collected: string[]; viewed: string[] }): void {
        this.collected = new Set(saved.collected);
        this.viewed = new Set(saved.viewed);
    }

    // ============================================================
    // Events
    // ============================================================

    addEventListener(listener: MemoryEventListener): void {
        this.listeners.push(listener);
    }

    removeEventListener(listener: MemoryEventListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    private emit(payload: MemoryEventPayload): void {
        for (const listener of this.listeners) {
            listener(payload);
        }
    }
}
