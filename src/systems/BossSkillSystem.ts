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

    constructor() {
        this.skills = new Map();
        this.lastUsedAt = new Map();

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
        const skill = this.getSkill(skillId);

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
}