export type BossSkillId =
    | "skill1"
    | "skill2";

export interface BossSkillData {
    id: BossSkillId;
    name: string;
    damageMultiplier: number;
}

export class BossSkillSystem {
    private readonly skills: Map<
        BossSkillId,
        BossSkillData
    >;

    constructor() {
        this.skills = new Map();

        this.registerSkill({
            id: "skill1",
            name: "Skill 1",
            damageMultiplier: 2.0,
        });

        this.registerSkill({
            id: "skill2",
            name: "Skill 2",
            damageMultiplier: 3.5,
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
}