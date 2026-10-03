import type { BossId } from "../bosses/BossRegistry";

export interface BossRewardInfo {
    bossId: BossId;
    rewardId: string;
    memoryId?: string;
    description: string;
}

export interface BossProgressionResult {
    defeatedBossId: BossId;
    reward: BossRewardInfo;
    unlockedBossId: BossId | null;
    isProgressionComplete: boolean;
}

export interface BossProgressionState {
    unlocked: BossId[];
    defeated: BossId[];
}

export class BossProgressionManager {
    private unlockedBosses: Set<BossId> = new Set(["boss-1"]);
    private defeatedBosses: Set<BossId> = new Set();

    private readonly rewards: Map<BossId, BossRewardInfo> = new Map([
        [
            "boss-1",
            {
                bossId: "boss-1",
                rewardId: "reward_boss_1",
                memoryId: "mem_boss_1_victory",
                description: "Vượt qua thử thách Boss 1 — Mở khóa Boss 2",
            },
        ],
        [
            "boss-2",
            {
                bossId: "boss-2",
                rewardId: "reward_boss_2",
                memoryId: "mem_boss_2_victory",
                description: "Vượt qua thử thách Boss 2 — Mở khóa Boss 3",
            },
        ],
        [
            "boss-3",
            {
                bossId: "boss-3",
                rewardId: "reward_boss_3_final",
                memoryId: "mem_boss_3_victory",
                description: "Chiến thắng Boss 3 — Hoàn thành toàn bộ thử thách Boss!",
            },
        ],
    ]);

    isBossUnlocked(bossId: BossId): boolean {
        return this.unlockedBosses.has(bossId);
    }

    isBossDefeated(bossId: BossId): boolean {
        return this.defeatedBosses.has(bossId);
    }

    canEncounterBoss(bossId: BossId): boolean {
        // A boss can only be encountered if it is unlocked and preceding bosses have been defeated
        if (bossId === "boss-1") {
            return this.isBossUnlocked("boss-1");
        }
        if (bossId === "boss-2") {
            return this.isBossUnlocked("boss-2") && this.isBossDefeated("boss-1");
        }
        if (bossId === "boss-3") {
            return (
                this.isBossUnlocked("boss-3") &&
                this.isBossDefeated("boss-1") &&
                this.isBossDefeated("boss-2")
            );
        }
        return false;
    }

    recordBossDefeat(bossId: BossId): BossProgressionResult {
        if (!this.canEncounterBoss(bossId)) {
            throw new Error(
                `Cannot defeat ${bossId} before prerequisites are unlocked and defeated.`
            );
        }

        this.defeatedBosses.add(bossId);

        let unlockedBossId: BossId | null = null;

        if (bossId === "boss-1") {
            this.unlockedBosses.add("boss-2");
            unlockedBossId = "boss-2";
        } else if (bossId === "boss-2") {
            this.unlockedBosses.add("boss-3");
            unlockedBossId = "boss-3";
        }

        const reward = this.rewards.get(bossId) ?? {
            bossId,
            rewardId: `reward_${bossId}`,
            description: `Chiến thắng ${bossId}`,
        };

        const isProgressionComplete =
            this.isBossDefeated("boss-1") &&
            this.isBossDefeated("boss-2") &&
            this.isBossDefeated("boss-3");

        return {
            defeatedBossId: bossId,
            reward,
            unlockedBossId,
            isProgressionComplete,
        };
    }

    getCurrentTargetBoss(): BossId | null {
        if (!this.isBossDefeated("boss-1")) {
            return "boss-1";
        }
        if (!this.isBossDefeated("boss-2")) {
            return "boss-2";
        }
        if (!this.isBossDefeated("boss-3")) {
            return "boss-3";
        }
        return null;
    }

    isProgressionComplete(): boolean {
        return (
            this.isBossDefeated("boss-1") &&
            this.isBossDefeated("boss-2") &&
            this.isBossDefeated("boss-3")
        );
    }

    getRewardInfo(bossId: BossId): BossRewardInfo | undefined {
        return this.rewards.get(bossId);
    }

    serialize(): BossProgressionState {
        return {
            unlocked: Array.from(this.unlockedBosses),
            defeated: Array.from(this.defeatedBosses),
        };
    }

    deserialize(state: BossProgressionState): void {
        this.unlockedBosses = new Set(state.unlocked);
        this.defeatedBosses = new Set(state.defeated);
    }

    reset(): void {
        this.unlockedBosses = new Set(["boss-1"]);
        this.defeatedBosses = new Set();
    }
}
