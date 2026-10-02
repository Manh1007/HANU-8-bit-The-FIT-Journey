import { BossCombatController } from "./BossCombatController";
import type { BossCombatResult } from "./BossCombatResult";
import type { BossSkillId } from "./BossSkillSystem";
import { PlayerCombat, type AttackResult } from "./PlayerCombat";
import { PlayerStats } from "./PlayerStats";

// ============================================================
// Phase A21 — Boss / Academic Challenge Gameplay
// ============================================================

export type ChallengeStatus =
    | "locked"
    | "available"
    | "in_progress"
    | "completed"
    | "failed";

export interface AcademicChallengeData {
    /** Unique challenge ID (e.g. "challenge_cs101") */
    id: string;
    /** Challenge title (e.g. "Thi kết thúc học phần: Lập trình cơ bản") */
    title: string;
    /** Subject name (e.g. "Nhập môn Lập trình") */
    subject: string;
    /** Detailed description / objectives */
    description: string;
    /** ID of the boss representing this academic challenge */
    bossId: string;
    /** Location where this challenge takes place (e.g. "location_nha_c") */
    locationId: string;
    /** Quest that must be active/completed to take challenge */
    requiredQuestId?: string;
    /** Memory fragments awarded upon victory */
    rewardMemoryIds?: string[];
    /** Follow-up quest unlocked upon victory */
    unlockQuestId?: string;
    /** Location unlocked upon victory */
    unlockLocationId?: string;
}

export type EncounterState =
    | "idle"
    | "in_progress"
    | "player_won"
    | "player_lost";

export interface PlayerAttackEncounterResult {
    attackResult: AttackResult | null;
    bossPhaseChanged: boolean;
    bossCurrentPhase: number;
    bossDefeated: boolean;
}

export interface BossActionEncounterResult {
    combatResult: BossCombatResult;
    playerDied: boolean;
    playerRemainingHp: number;
}

/**
 * BossEncounter — orchestrates the combat flow between the Player and a Boss
 * during an Academic Challenge.
 *
 * Flow:
 * 1. Player initiates encounter
 * 2. Combat exchanges: Player attacks & Boss skills/attacks
 * 3. Boss takes damage and changes phases dynamically
 * 4. Boss defeat triggers victory callback and rewards
 */
export class BossEncounter {
    private readonly challenge: AcademicChallengeData;
    private readonly bossController: BossCombatController;
    private readonly playerCombat: PlayerCombat;
    private readonly playerStats: PlayerStats;
    private readonly onVictoryCallback?: (challenge: AcademicChallengeData) => void;

    private state: EncounterState = "idle";
    private turnCount = 0;

    constructor(
        challenge: AcademicChallengeData,
        bossController: BossCombatController,
        playerCombat: PlayerCombat,
        playerStats: PlayerStats,
        onVictoryCallback?: (challenge: AcademicChallengeData) => void
    ) {
        this.challenge = challenge;
        this.bossController = bossController;
        this.playerCombat = playerCombat;
        this.playerStats = playerStats;
        this.onVictoryCallback = onVictoryCallback;
    }

    start(): boolean {
        if (this.playerStats.isDead() || this.bossController.getBoss().isDead()) {
            return false;
        }

        const started = this.bossController.startCombat();
        if (started) {
            this.state = "in_progress";
            this.turnCount = 0;
            return true;
        }
        return false;
    }

    /**
     * Player attacks the boss at currentTime.
     * Updates boss phase if damage crossed HP thresholds.
     * If boss HP reaches 0, transitions encounter to "player_won".
     */
    playerAttack(currentTime: number): PlayerAttackEncounterResult {
        if (this.state !== "in_progress") {
            return {
                attackResult: null,
                bossPhaseChanged: false,
                bossCurrentPhase: this.bossController.getBoss().getCurrentPhase(),
                bossDefeated: false,
            };
        }

        if (!this.playerCombat.attack(currentTime)) {
            return {
                attackResult: null,
                bossPhaseChanged: false,
                bossCurrentPhase: this.bossController.getBoss().getCurrentPhase(),
                bossDefeated: false,
            };
        }

        const boss = this.bossController.getBoss();
        const attackResult = this.playerCombat.attackTarget(boss);
        this.turnCount++;

        // Check boss phase transition
        const phaseResult = this.bossController.updateBossPhase();

        const bossDefeated = boss.isDead();
        if (bossDefeated) {
            this.state = "player_won";
            this.onVictoryCallback?.(this.challenge);
        }

        return {
            attackResult,
            bossPhaseChanged: phaseResult.changed,
            bossCurrentPhase: phaseResult.currentPhase,
            bossDefeated,
        };
    }

    /**
     * Boss attacks the player or uses a skill.
     * Damage is calculated through BossCombatController and applied to player.
     */
    bossAction(
        currentTime: number,
        skillId?: BossSkillId,
        randomValue: number = 0
    ): BossActionEncounterResult {
        if (this.state !== "in_progress") {
            return {
                combatResult: {
                    success: false,
                    skillResult: {
                        success: false,
                        skillId: skillId ?? "normal",
                        damage: 0,
                        critical: false,
                    },
                    finalDamage: 0,
                },
                playerDied: this.playerStats.isDead(),
                playerRemainingHp: this.playerStats.getHp(),
            };
        }

        let combatResult: BossCombatResult;

        if (skillId && this.bossController.canUseSkill(skillId, currentTime)) {
            combatResult = this.bossController.executeSkill(
                skillId,
                currentTime,
                randomValue,
                this.playerStats.getArmor()
            );
        } else {
            combatResult = this.bossController.executeNormalAttack(
                this.playerStats.getArmor()
            );
        }

        if (combatResult.success && combatResult.finalDamage > 0) {
            this.playerStats.takeDamage(combatResult.finalDamage);
        }

        const playerDied = this.playerStats.isDead();
        if (playerDied) {
            this.state = "player_lost";
        }

        return {
            combatResult,
            playerDied,
            playerRemainingHp: this.playerStats.getHp(),
        };
    }

    getState(): EncounterState {
        return this.state;
    }

    getChallenge(): AcademicChallengeData {
        return this.challenge;
    }

    getBossController(): BossCombatController {
        return this.bossController;
    }

    getTurnCount(): number {
        return this.turnCount;
    }

    isOver(): boolean {
        return this.state === "player_won" || this.state === "player_lost";
    }

    isPlayerWon(): boolean {
        return this.state === "player_won";
    }
}

/**
 * AcademicChallengeManager — manages registration and execution of
 * academic bosses and exam challenges.
 */
export class AcademicChallengeManager {
    private challenges: Map<string, AcademicChallengeData> = new Map();
    private bossFactories: Map<string, () => BossCombatController> = new Map();
    private activeEncounter: BossEncounter | null = null;
    private completedChallengeIds: Set<string> = new Set();

    /** Callback invoked whenever a challenge is won (e.g. to notify GameState) */
    private onChallengeWonListener?: (challenge: AcademicChallengeData) => void;

    setOnChallengeWonListener(listener: (challenge: AcademicChallengeData) => void): void {
        this.onChallengeWonListener = listener;
    }

    registerChallenge(
        data: AcademicChallengeData,
        bossFactory: () => BossCombatController
    ): void {
        this.challenges.set(data.id, data);
        this.bossFactories.set(data.id, bossFactory);
    }

    getChallenge(id: string): AcademicChallengeData | undefined {
        return this.challenges.get(id);
    }

    getAllChallenges(): AcademicChallengeData[] {
        return Array.from(this.challenges.values());
    }

    isChallengeCompleted(id: string): boolean {
        return this.completedChallengeIds.has(id);
    }

    /**
     * Start a challenge encounter with the player.
     */
    startChallenge(
        challengeId: string,
        playerCombat: PlayerCombat,
        playerStats: PlayerStats
    ): BossEncounter | null {
        const challenge = this.challenges.get(challengeId);
        const factory = this.bossFactories.get(challengeId);

        if (!challenge || !factory) {
            return null;
        }

        const bossController = factory();

        const encounter = new BossEncounter(
            challenge,
            bossController,
            playerCombat,
            playerStats,
            (wonChallenge) => {
                this.completedChallengeIds.add(wonChallenge.id);
                this.onChallengeWonListener?.(wonChallenge);
            }
        );

        if (encounter.start()) {
            this.activeEncounter = encounter;
            return encounter;
        }

        return null;
    }

    getActiveEncounter(): BossEncounter | null {
        return this.activeEncounter;
    }

    endActiveEncounter(): void {
        this.activeEncounter = null;
    }

    serialize(): { completed: string[] } {
        return {
            completed: Array.from(this.completedChallengeIds),
        };
    }

    deserialize(data: { completed: string[] }): void {
        this.completedChallengeIds = new Set(data.completed);
    }
}
