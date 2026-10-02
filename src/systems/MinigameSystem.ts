// ============================================================
// Minigame Framework (Phase A17)
// ============================================================

export type MinigameStatus = "idle" | "running" | "paused" | "completed" | "failed";

export interface MinigameConfig {
    id: string;
    title: string;
    description: string;
    /** Max time in seconds (0 = no limit) */
    timeLimit: number;
    /** Number of lives (0 = unlimited) */
    lives: number;
    /** Reward(s) on completion */
    rewardQuestObjective?: { type: string; targetId: string };
    rewardMemoryId?: string;
    rewardItemId?: string;
}

export interface MinigameResult {
    minigameId: string;
    status: "completed" | "failed";
    score: number;
    timeElapsed: number;
}

/**
 * Base class for all minigames.
 *
 * Each minigame extends this and implements:
 * - `onStart()` — initialize state
 * - `onUpdate(dt)` — frame logic
 * - `onEnd()` — cleanup
 *
 * MinigameRunner drives the lifecycle.
 * The actual Phaser scene calls update/input — this class is pure logic.
 */
export abstract class MinigameBase {
    protected readonly config: MinigameConfig;
    protected status: MinigameStatus = "idle";
    protected score = 0;
    protected timeElapsed = 0;
    protected livesRemaining: number;

    constructor(config: MinigameConfig) {
        this.config = config;
        this.livesRemaining = config.lives > 0 ? config.lives : Infinity;
    }

    // ============================================================
    // Lifecycle (called by MinigameRunner)
    // ============================================================

    start(): void {
        if (this.status !== "idle") return;
        this.status = "running";
        this.score = 0;
        this.timeElapsed = 0;
        this.livesRemaining = this.config.lives > 0 ? this.config.lives : Infinity;
        this.onStart();
    }

    update(dt: number): MinigameResult | null {
        if (this.status !== "running") return null;

        this.timeElapsed += dt;

        // Time limit check
        if (this.config.timeLimit > 0 && this.timeElapsed / 1000 >= this.config.timeLimit) {
            return this.fail();
        }

        return this.onUpdate(dt);
    }

    pause(): void {
        if (this.status === "running") this.status = "paused";
    }

    protected endResult: MinigameResult | null = null;

    resume(): void {
        if (this.status === "paused") this.status = "running";
    }

    protected complete(): MinigameResult {
        this.status = "completed";
        this.onEnd();
        this.endResult = {
            minigameId: this.config.id,
            status: "completed",
            score: this.score,
            timeElapsed: this.timeElapsed,
        };
        return this.endResult;
    }

    protected fail(): MinigameResult {
        this.status = "failed";
        this.onEnd();
        this.endResult = {
            minigameId: this.config.id,
            status: "failed",
            score: this.score,
            timeElapsed: this.timeElapsed,
        };
        return this.endResult;
    }

    getEndResult(): MinigameResult | null {
        return this.endResult;
    }

    protected loseLife(): MinigameResult | null {
        if (this.config.lives > 0) {
            this.livesRemaining--;
            if (this.livesRemaining <= 0) {
                return this.fail();
            }
        }
        return null;
    }

    // ============================================================
    // Abstract — subclasses implement
    // ============================================================

    protected abstract onStart(): void;
    protected abstract onUpdate(dt: number): MinigameResult | null;
    protected abstract onEnd(): void;

    // ============================================================
    // State queries
    // ============================================================

    getStatus(): MinigameStatus { return this.status; }
    getScore(): number { return this.score; }
    getTimeElapsed(): number { return this.timeElapsed; }
    getLivesRemaining(): number { return this.livesRemaining; }
    getConfig(): MinigameConfig { return this.config; }
    isRunning(): boolean { return this.status === "running"; }
    isOver(): boolean { return this.status === "completed" || this.status === "failed"; }
}

// ============================================================
// MinigameRunner — manages the active minigame
// ============================================================

export type MinigameResultListener = (result: MinigameResult) => void;

/**
 * MinigameRunner — drives the lifecycle of the active minigame.
 *
 * Scene calls: runner.update(dt) each frame.
 * On finish, emits result so GameState can apply rewards.
 */
export class MinigameRunner {
    private active: MinigameBase | null = null;
    private listeners: MinigameResultListener[] = [];

    startMinigame(minigame: MinigameBase): void {
        if (this.active?.isRunning()) {
            this.active.pause(); // suspend current
        }
        this.active = minigame;
        this.active.start();
    }

    update(dt: number): void {
        if (!this.active) return;

        if (this.active.isOver()) {
            const endResult = this.active.getEndResult() ?? {
                minigameId: this.active.getConfig().id,
                status: this.active.getStatus() as "completed" | "failed",
                score: this.active.getScore(),
                timeElapsed: this.active.getTimeElapsed(),
            };
            this.emit(endResult);
            this.active = null;
            return;
        }

        if (!this.active.isRunning()) return;

        const result = this.active.update(dt);

        if (result) {
            this.emit(result);
            this.active = null;
        }
    }

    pauseCurrent(): void {
        this.active?.pause();
    }

    resumeCurrent(): void {
        this.active?.resume();
    }

    getActive(): MinigameBase | null {
        return this.active;
    }

    isRunning(): boolean {
        return this.active?.isRunning() ?? false;
    }

    addEventListener(listener: MinigameResultListener): void {
        this.listeners.push(listener);
    }

    removeEventListener(listener: MinigameResultListener): void {
        this.listeners = this.listeners.filter((l) => l !== listener);
    }

    private emit(result: MinigameResult): void {
        for (const listener of this.listeners) {
            listener(result);
        }
    }
}

// ============================================================
// Example concrete minigame — TypingMinigame
// (Placeholder implementation for testing the framework)
// ============================================================

export interface TypingMinigameConfig extends MinigameConfig {
    /** Words to type (fill with actual content later) */
    words: string[];
}

/**
 * TypingMinigame — player types given words/code before time runs out.
 * Represents programming challenges (Type the code!).
 */
export class TypingMinigame extends MinigameBase {
    private words: string[];
    private currentIndex = 0;

    constructor(config: TypingMinigameConfig) {
        super(config);
        this.words = [...config.words];
    }

    protected onStart(): void {
        this.currentIndex = 0;
    }

    protected onEnd(): void {
        // cleanup
    }

    protected onUpdate(_dt: number): MinigameResult | null {
        // Frame logic: just check completion state
        // Input is fed via submitWord()
        return null;
    }

    /**
     * Player submits a typed word.
     * Returns true if correct, and result if the game ends.
     */
    submitWord(word: string): { correct: boolean; result: MinigameResult | null } {
        if (!this.isRunning()) return { correct: false, result: null };

        const expected = this.words[this.currentIndex];
        const correct = word.trim() === expected;

        if (correct) {
            this.score += 100;
            this.currentIndex++;

            if (this.currentIndex >= this.words.length) {
                return { correct: true, result: this.complete() };
            }
        } else {
            const lifeResult = this.loseLife();
            if (lifeResult) {
                return { correct: false, result: lifeResult };
            }
        }

        return { correct, result: null };
    }

    getCurrentWord(): string | null {
        return this.words[this.currentIndex] ?? null;
    }

    getProgress(): { current: number; total: number } {
        return { current: this.currentIndex, total: this.words.length };
    }
}
