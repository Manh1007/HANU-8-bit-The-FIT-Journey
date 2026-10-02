import {
    BossSkillValidator,
} from "./BossSkillValidator";
import type {
    BossSkillState,
} from "./BossSkillState";
import type {
    BossSkillInfo,
} from "./BossSkillInfo";

export type BossSkillId =
    | "skill1"
    | "skill2";

export interface BossSkillData {
    id: BossSkillId;
    name: string;
    damageMultiplier: number;
    cooldown: number;
}

export class BossSkillSystem {
    private readonly skills: Map<
        BossSkillId,
        BossSkillData
    >;

    private readonly lastUsedAt: Map<
        BossSkillId,
        number
    >;

    private readonly validator:
        BossSkillValidator;

    constructor() {
        this.skills = new Map();
        this.lastUsedAt = new Map();
        this.validator =
            new BossSkillValidator();

        this.registerSkill({
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 2.0,
            cooldown: 3000,
        });

        this.registerSkill({
            id: "skill2",
            name: "Skill 2",
            damageMultiplier: 3.5,
            cooldown: 5000,
        });
    }

    private registerSkill(
        skill: BossSkillData
    ): void {
        if (
            !this.validator.validate(skill)
        ) {
            throw new Error(
                `Invalid boss skill configuration: ${skill.id}`
            );
        }

        if (
            this.skills.has(skill.id)
        ) {
            throw new Error(
                `Boss skill already registered: ${skill.id}`
            );
        }

        this.skills.set(
            skill.id,
            skill
        );
    }

    getSkill(
        skillId: BossSkillId
    ): BossSkillData | undefined {
        return this.skills.get(skillId);
    }

    hasSkill(
        skillId: BossSkillId
    ): boolean {
        return this.skills.has(skillId);
    }

    canUseSkill(
        skillId: BossSkillId,
        currentTime: number
    ): boolean {
        const skill =
            this.getSkill(skillId);

        if (!skill) {
            return false;
        }

        const lastUsed =
            this.lastUsedAt.get(skillId);

        if (lastUsed === undefined) {
            return true;
        }

        return (
            currentTime - lastUsed >=
            skill.cooldown
        );
    }

    getRemainingCooldown(
        skillId: BossSkillId,
        currentTime: number
    ): number {
        const skill =
            this.getSkill(skillId);

        if (!skill) {
            return 0;
        }

        const lastUsed =
            this.lastUsedAt.get(skillId);

        if (lastUsed === undefined) {
            return 0;
        }

        const elapsed =
            currentTime - lastUsed;

        return Math.max(
            0,
            skill.cooldown - elapsed
        );
    }

    getSkillState(
        skillId: BossSkillId,
        currentTime: number
    ): BossSkillState {
        const skill =
            this.getSkill(skillId);

        if (!skill) {
            return "unavailable";
        }

        if (
            this.canUseSkill(
                skillId,
                currentTime
            )
        ) {
            return "ready";
        }

        return "cooldown";
    }

    getSkillInfo(
        skillId: BossSkillId,
        currentTime: number
    ): BossSkillInfo | undefined {
        const skill =
            this.getSkill(skillId);

        if (!skill) {
            return undefined;
        }

        const state =
            this.getSkillState(
                skillId,
                currentTime
            );

        const remainingCooldown =
            this.getRemainingCooldown(
                skillId,
                currentTime
            );

        return {
            skill,
            state,
            remainingCooldown,
            available:
                state === "ready",
        };
    }

    useSkill(
        skillId: BossSkillId,
        currentTime: number
    ): boolean {
        if (
            !this.canUseSkill(
                skillId,
                currentTime
            )
        ) {
            return false;
        }

        this.lastUsedAt.set(
            skillId,
            currentTime
        );

        return true;
    }

    resetSkillCooldown(
        skillId: BossSkillId
    ): boolean {
        if (!this.skills.has(skillId)) {
            return false;
        }

        this.lastUsedAt.delete(skillId);

        return true;
    }

    resetAllCooldowns(): void {
        this.lastUsedAt.clear();
    }
}