import { describe, expect, test, beforeEach } from "vitest";
import { BossProgressionManager } from "../systems/BossProgression";
import { GameState } from "../systems/GameState";

describe("BossProgression", () => {
    let progression: BossProgressionManager;

    beforeEach(() => {
        progression = new BossProgressionManager();
        GameState.reset();
    });

    describe("1. Initial Progression State", () => {
        test("only Boss 1 is initially unlocked", () => {
            expect(progression.isBossUnlocked("boss-1")).toBe(true);
            expect(progression.isBossUnlocked("boss-2")).toBe(false);
            expect(progression.isBossUnlocked("boss-3")).toBe(false);
        });

        test("only Boss 1 can be encountered initially", () => {
            expect(progression.canEncounterBoss("boss-1")).toBe(true);
            expect(progression.canEncounterBoss("boss-2")).toBe(false);
            expect(progression.canEncounterBoss("boss-3")).toBe(false);
        });

        test("none of the bosses are initially defeated", () => {
            expect(progression.isBossDefeated("boss-1")).toBe(false);
            expect(progression.isBossDefeated("boss-2")).toBe(false);
            expect(progression.isBossDefeated("boss-3")).toBe(false);
            expect(progression.isProgressionComplete()).toBe(false);
            expect(progression.getCurrentTargetBoss()).toBe("boss-1");
        });
    });

    describe("2. Linear Progression Flow", () => {
        test("cannot defeat Boss 2 before Boss 1 is defeated", () => {
            expect(() => progression.recordBossDefeat("boss-2")).toThrow(
                "Cannot defeat boss-2 before prerequisites are unlocked and defeated."
            );
        });

        test("cannot defeat Boss 3 before Boss 1 and Boss 2 are defeated", () => {
            expect(() => progression.recordBossDefeat("boss-3")).toThrow(
                "Cannot defeat boss-3 before prerequisites are unlocked and defeated."
            );
        });

        test("defeating Boss 1 unlocks Boss 2 and awards reward", () => {
            const result = progression.recordBossDefeat("boss-1");

            expect(result.defeatedBossId).toBe("boss-1");
            expect(result.unlockedBossId).toBe("boss-2");
            expect(result.isProgressionComplete).toBe(false);
            expect(result.reward.rewardId).toBe("reward_boss_1");

            expect(progression.isBossDefeated("boss-1")).toBe(true);
            expect(progression.isBossUnlocked("boss-2")).toBe(true);
            expect(progression.canEncounterBoss("boss-2")).toBe(true);

            // Boss 3 still locked
            expect(progression.isBossUnlocked("boss-3")).toBe(false);
            expect(progression.canEncounterBoss("boss-3")).toBe(false);
            expect(progression.getCurrentTargetBoss()).toBe("boss-2");
        });

        test("defeating Boss 2 unlocks Boss 3 and awards reward", () => {
            progression.recordBossDefeat("boss-1");
            const result = progression.recordBossDefeat("boss-2");

            expect(result.defeatedBossId).toBe("boss-2");
            expect(result.unlockedBossId).toBe("boss-3");
            expect(result.isProgressionComplete).toBe(false);
            expect(result.reward.rewardId).toBe("reward_boss_2");

            expect(progression.isBossDefeated("boss-2")).toBe(true);
            expect(progression.isBossUnlocked("boss-3")).toBe(true);
            expect(progression.canEncounterBoss("boss-3")).toBe(true);
            expect(progression.getCurrentTargetBoss()).toBe("boss-3");
        });

        test("defeating Boss 3 completes progression and awards final reward", () => {
            progression.recordBossDefeat("boss-1");
            progression.recordBossDefeat("boss-2");
            const result = progression.recordBossDefeat("boss-3");

            expect(result.defeatedBossId).toBe("boss-3");
            expect(result.unlockedBossId).toBeNull();
            expect(result.isProgressionComplete).toBe(true);
            expect(result.reward.rewardId).toBe("reward_boss_3_final");

            expect(progression.isBossDefeated("boss-3")).toBe(true);
            expect(progression.isProgressionComplete()).toBe(true);
            expect(progression.getCurrentTargetBoss()).toBeNull();
        });
    });

    describe("3. Save and Load Integration", () => {
        test("serializes and deserializes progression state", () => {
            progression.recordBossDefeat("boss-1");
            const savedState = progression.serialize();

            const newProgression = new BossProgressionManager();
            newProgression.deserialize(savedState);

            expect(newProgression.isBossDefeated("boss-1")).toBe(true);
            expect(newProgression.isBossUnlocked("boss-2")).toBe(true);
            expect(newProgression.canEncounterBoss("boss-2")).toBe(true);
            expect(newProgression.isBossUnlocked("boss-3")).toBe(false);
            expect(newProgression.getCurrentTargetBoss()).toBe("boss-2");
        });

        test("GameState saves and restores boss progression state", () => {
            const gs = GameState.getInstance();
            expect(gs.bossProgression.isBossUnlocked("boss-1")).toBe(true);
            expect(gs.bossProgression.isBossUnlocked("boss-2")).toBe(false);

            // Emit defeat event for boss-1
            gs.onGameEvent("defeat_enemy", "boss-1");
            expect(gs.bossProgression.isBossDefeated("boss-1")).toBe(true);
            expect(gs.bossProgression.isBossUnlocked("boss-2")).toBe(true);

            // Save game
            const saved = gs.save(100, 100, "CampusScene");
            expect(saved).toBe(true);

            // Reset GameState and reload
            GameState.reset();
            const reloadedGs = GameState.getInstance();
            const loaded = reloadedGs.load(new Map());
            expect(loaded).toBe(true);

            expect(reloadedGs.bossProgression.isBossDefeated("boss-1")).toBe(true);
            expect(reloadedGs.bossProgression.isBossUnlocked("boss-2")).toBe(true);
            expect(reloadedGs.bossProgression.canEncounterBoss("boss-2")).toBe(true);
            expect(reloadedGs.bossProgression.isBossUnlocked("boss-3")).toBe(false);
        });
    });
});
