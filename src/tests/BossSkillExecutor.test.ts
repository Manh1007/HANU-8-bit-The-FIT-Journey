import {
    describe,
    expect,
    test,
} from "vitest";

import { Boss1 } from "../bosses/Boss1";
import {
    BossSkillSystem,
} from "../systems/BossSkillSystem";
import {
    BossSkillExecutor,
} from "../systems/BossSkillExecutor";
import {
    BossPhaseBehavior,
} from "../systems/BossPhaseBehavior";

describe(
    "BossSkillExecutor",
    () => {
        function createPhaseBehavior():
            BossPhaseBehavior {
            return new BossPhaseBehavior([
                {
                    phase: 1,
                    attackMultiplier: 1,
                    armorBonus: 0,
                    skill1Multiplier: 2,
                    skill2Multiplier: 3.5,
                },
                {
                    phase: 2,
                    attackMultiplier: 1.2,
                    armorBonus: 15,
                    skill1Multiplier: 2.5,
                    skill2Multiplier: 4,
                },
            ]);
        }

        function createExecutor(): BossSkillExecutor {
            const boss =
                new Boss1();

            const skillSystem =
                new BossSkillSystem();

            const phaseBehavior =
                createPhaseBehavior();

            return new BossSkillExecutor(
                boss,
                skillSystem,
                boss.getCombatData(),
                phaseBehavior
            );
        }

        function createPhaseTwoExecutor():
            BossSkillExecutor {
            const boss =
                new Boss1();

            const skillSystem =
                new BossSkillSystem();

            const phaseBehavior =
                createPhaseBehavior();

            boss.startBattle();

            boss.takeDamage(150);

            boss.updatePhase();

            return new BossSkillExecutor(
                boss,
                skillSystem,
                boss.getCombatData(),
                phaseBehavior
            );
        }

        test(
            "executes skill 1 without critical",
            () => {
                const executor =
                    createExecutor();

                const result =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.8
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill1");

                expect(
                    result.damage
                ).toBe(20);

                expect(
                    result.critical
                ).toBe(false);
            }
        );

        test(
            "executes skill 1 with critical",
            () => {
                const executor =
                    createExecutor();

                const result =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.2
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill1");

                expect(
                    result.damage
                ).toBe(34);

                expect(
                    result.critical
                ).toBe(true);
            }
        );

        test(
            "executes skill 2 without critical",
            () => {
                const executor =
                    createExecutor();

                const result =
                    executor.executeSkill(
                        "skill2",
                        1000,
                        0.8
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill2");

                expect(
                    result.damage
                ).toBe(35);

                expect(
                    result.critical
                ).toBe(false);
            }
        );

        test(
            "executes skill 2 with critical",
            () => {
                const executor =
                    createExecutor();

                const result =
                    executor.executeSkill(
                        "skill2",
                        1000,
                        0.2
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill2");

                expect(
                    result.damage
                ).toBe(59.5);

                expect(
                    result.critical
                ).toBe(true);
            }
        );

        test(
            "critical chance boundary is respected",
            () => {
                const executor =
                    createExecutor();

                const result =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.4
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.critical
                ).toBe(false);

                expect(
                    result.damage
                ).toBe(20);
            }
        );

        test(
            "returns failed result when skill is on cooldown",
            () => {
                const executor =
                    createExecutor();

                const firstResult =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.2
                    );

                const secondResult =
                    executor.executeSkill(
                        "skill1",
                        2000,
                        0.2
                    );

                expect(
                    firstResult.success
                ).toBe(true);

                expect(
                    firstResult.critical
                ).toBe(true);

                expect(
                    secondResult.success
                ).toBe(false);

                expect(
                    secondResult.skillId
                ).toBe("skill1");

                expect(
                    secondResult.damage
                ).toBe(0);

                expect(
                    secondResult.critical
                ).toBe(false);
            }
        );

        test(
            "allows skill after cooldown",
            () => {
                const executor =
                    createExecutor();

                const firstResult =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.8
                    );

                const secondResult =
                    executor.executeSkill(
                        "skill1",
                        4000,
                        0.8
                    );

                expect(
                    firstResult.success
                ).toBe(true);

                expect(
                    secondResult.success
                ).toBe(true);

                expect(
                    firstResult.damage
                ).toBe(20);

                expect(
                    secondResult.damage
                ).toBe(20);
            }
        );

        test(
            "skill cooldowns remain independent",
            () => {
                const executor =
                    createExecutor();

                const skill1Result =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.8
                    );

                const skill2Result =
                    executor.executeSkill(
                        "skill2",
                        1000,
                        0.8
                    );

                expect(
                    skill1Result.success
                ).toBe(true);

                expect(
                    skill1Result.damage
                ).toBe(20);

                expect(
                    skill2Result.success
                ).toBe(true);

                expect(
                    skill2Result.damage
                ).toBe(35);
            }
        );

        test(
            "phase 2 uses phase-specific skill 1 multiplier",
            () => {
                const executor =
                    createPhaseTwoExecutor();

                const result =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.8
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill1");

                expect(
                    result.damage
                ).toBe(25);

                expect(
                    result.critical
                ).toBe(false);
            }
        );

        test(
            "phase 2 uses phase-specific skill 2 multiplier",
            () => {
                const executor =
                    createPhaseTwoExecutor();

                const result =
                    executor.executeSkill(
                        "skill2",
                        1000,
                        0.8
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill2");

                expect(
                    result.damage
                ).toBe(40);

                expect(
                    result.critical
                ).toBe(false);
            }
        );

        test(
            "phase 2 critical skill 1 uses phase-specific multiplier",
            () => {
                const executor =
                    createPhaseTwoExecutor();

                const result =
                    executor.executeSkill(
                        "skill1",
                        1000,
                        0.2
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill1");

                expect(
                    result.damage
                ).toBe(42.5);

                expect(
                    result.critical
                ).toBe(true);
            }
        );

        test(
            "phase 2 critical skill 2 uses phase-specific multiplier",
            () => {
                const executor =
                    createPhaseTwoExecutor();

                const result =
                    executor.executeSkill(
                        "skill2",
                        1000,
                        0.2
                    );

                expect(
                    result.success
                ).toBe(true);

                expect(
                    result.skillId
                ).toBe("skill2");

                expect(
                    result.damage
                ).toBe(68);

                expect(
                    result.critical
                ).toBe(true);
            }
        );
    }
);