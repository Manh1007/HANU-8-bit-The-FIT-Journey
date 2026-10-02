import {
    describe,
    expect,
    test,
} from "vitest";

import { Boss1 } from "../bosses/Boss1";
import {
    BossCombatSystem,
} from "../systems/BossCombatSystem";
import {
    BossSkillSystem,
} from "../systems/BossSkillSystem";
import {
    BossCombatController,
} from "../systems/BossCombatController";
import {
    BossPhaseBehavior,
} from "../systems/BossPhaseBehavior";
import {
    DamageSystem,
} from "../systems/DamageSystem";

describe(
    "BossPhaseResult",
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

        function createController() {
            const boss =
                new Boss1();

            const phaseBehavior =
                createPhaseBehavior();

            const combatSystem =
                new BossCombatSystem(
                    boss,
                    boss.getCombatData(),
                    phaseBehavior
                );

            const skillSystem =
                new BossSkillSystem();

            const damageSystem =
                new DamageSystem();

            const controller =
                new BossCombatController(
                    boss,
                    combatSystem,
                    skillSystem,
                    damageSystem,
                    boss.getCombatData(),
                    phaseBehavior
                );

            return {
                boss,
                controller,
            };
        }

        test(
            "inactive boss does not change phase",
            () => {
                const {
                    boss,
                    controller,
                } = createController();

                const result =
                    controller.updateBossPhase();

                expect(
                    result.changed
                ).toBe(false);

                expect(
                    result.previousPhase
                ).toBe(1);

                expect(
                    result.currentPhase
                ).toBe(1);

                expect(
                    boss.getCurrentPhase()
                ).toBe(1);
            }
        );

        test(
            "returns unchanged result before threshold",
            () => {
                const {
                    boss,
                    controller,
                } = createController();

                controller.startCombat();

                boss.takeDamage(100);

                const result =
                    controller.updateBossPhase();

                expect(
                    result.changed
                ).toBe(false);

                expect(
                    result.previousPhase
                ).toBe(1);

                expect(
                    result.currentPhase
                ).toBe(1);

                expect(
                    boss.getCurrentPhase()
                ).toBe(1);
            }
        );

        test(
            "returns phase transition result at threshold",
            () => {
                const {
                    boss,
                    controller,
                } = createController();

                controller.startCombat();

                boss.takeDamage(150);

                const result =
                    controller.updateBossPhase();

                expect(
                    result.changed
                ).toBe(true);

                expect(
                    result.previousPhase
                ).toBe(1);

                expect(
                    result.currentPhase
                ).toBe(2);

                expect(
                    boss.getCurrentPhase()
                ).toBe(2);
            }
        );

        test(
            "returns unchanged result after reaching phase 2",
            () => {
                const {
                    boss,
                    controller,
                } = createController();

                controller.startCombat();

                boss.takeDamage(150);

                const firstResult =
                    controller.updateBossPhase();

                expect(
                    firstResult.changed
                ).toBe(true);

                expect(
                    firstResult.previousPhase
                ).toBe(1);

                expect(
                    firstResult.currentPhase
                ).toBe(2);

                const secondResult =
                    controller.updateBossPhase();

                expect(
                    secondResult.changed
                ).toBe(false);

                expect(
                    secondResult.previousPhase
                ).toBe(2);

                expect(
                    secondResult.currentPhase
                ).toBe(2);
            }
        );

        test(
            "defeated boss cannot transition phase",
            () => {
                const {
                    boss,
                    controller,
                } = createController();

                controller.startCombat();

                boss.takeDamage(300);

                const result =
                    controller.updateBossPhase();

                expect(
                    result.changed
                ).toBe(false);

                expect(
                    result.previousPhase
                ).toBe(1);

                expect(
                    result.currentPhase
                ).toBe(1);

                expect(
                    boss.isDead()
                ).toBe(true);
            }
        );
    }
);