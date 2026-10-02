import {
    describe,
    expect,
    test,
} from "vitest";

import { BossPhaseBehavior }
    from "../systems/BossPhaseBehavior";

describe(
    "BossPhaseBehavior",
    () => {
        const behavior =
            new BossPhaseBehavior([
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

        test(
            "recognizes registered phases",
            () => {
                expect(
                    behavior.hasPhase(1)
                ).toBe(true);

                expect(
                    behavior.hasPhase(2)
                ).toBe(true);
            }
        );

        test(
            "returns phase data",
            () => {
                const data =
                    behavior.getPhaseData(2);

                expect(data)
                    .toEqual({
                        phase: 2,
                        attackMultiplier: 1.2,
                        armorBonus: 15,
                        skill1Multiplier: 2.5,
                        skill2Multiplier: 4,
                    });
            }
        );

        test(
            "returns attack multiplier",
            () => {
                expect(
                    behavior
                        .getAttackMultiplier(1)
                ).toBe(1);

                expect(
                    behavior
                        .getAttackMultiplier(2)
                ).toBe(1.2);
            }
        );

        test(
            "returns armor bonus",
            () => {
                expect(
                    behavior
                        .getArmorBonus(1)
                ).toBe(0);

                expect(
                    behavior
                        .getArmorBonus(2)
                ).toBe(15);
            }
        );

        test(
            "returns skill multipliers",
            () => {
                expect(
                    behavior
                        .getSkillMultiplier(
                            1,
                            "skill1"
                        )
                ).toBe(2);

                expect(
                    behavior
                        .getSkillMultiplier(
                            2,
                            "skill1"
                        )
                ).toBe(2.5);

                expect(
                    behavior
                        .getSkillMultiplier(
                            1,
                            "skill2"
                        )
                ).toBe(3.5);

                expect(
                    behavior
                        .getSkillMultiplier(
                            2,
                            "skill2"
                        )
                ).toBe(4);
            }
        );

        test(
            "uses default values for unknown phase",
            () => {
                expect(
                    behavior
                        .getAttackMultiplier(
                            3 as 1 | 2 | 3
                        )
                ).toBe(1);

                expect(
                    behavior
                        .getArmorBonus(
                            3 as 1 | 2 | 3
                        )
                ).toBe(0);
            }
        );

        test(
            "rejects invalid attack multiplier",
            () => {
                expect(
                    () =>
                        new BossPhaseBehavior([
                            {
                                phase: 1,
                                attackMultiplier: 0,
                                armorBonus: 0,
                                skill1Multiplier: 2,
                                skill2Multiplier: 3,
                            },
                        ])
                ).toThrow();
            }
        );

        test(
            "rejects negative armor bonus",
            () => {
                expect(
                    () =>
                        new BossPhaseBehavior([
                            {
                                phase: 1,
                                attackMultiplier: 1,
                                armorBonus: -1,
                                skill1Multiplier: 2,
                                skill2Multiplier: 3,
                            },
                        ])
                ).toThrow();
            }
        );
    }
);