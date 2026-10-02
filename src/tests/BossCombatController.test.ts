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

describe("BossCombatController", () => {
    function createPhaseBehavior(): BossPhaseBehavior {
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

    function createController(): BossCombatController {
        const boss = new Boss1();

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

        return new BossCombatController(
            boss,
            combatSystem,
            skillSystem,
            damageSystem,
            boss.getCombatData(),
            phaseBehavior
        );
    }

    function createActiveController(): BossCombatController {
        const controller =
            createController();

        expect(
            controller.startCombat()
        ).toBe(true);

        return controller;
    }

    test(
        "controller starts in inactive combat state",
        () => {
            const controller =
                createController();

            expect(
                controller.isCombatActive()
            ).toBe(false);

            expect(
                controller.getBoss().getState()
            ).toBe("idle");
        }
    );

    test(
        "starts combat successfully",
        () => {
            const controller =
                createController();

            expect(
                controller.startCombat()
            ).toBe(true);

            expect(
                controller.isCombatActive()
            ).toBe(true);

            expect(
                controller.getBoss().getState()
            ).toBe("active");
        }
    );

    test(
        "cannot execute normal attack while boss is idle",
        () => {
            const controller =
                createController();

            const result =
                controller.executeNormalAttack(0);

            expect(
                result.success
            ).toBe(false);

            expect(
                result.finalDamage
            ).toBe(0);

            expect(
                result.skillResult.damage
            ).toBe(0);
        }
    );

    test(
        "cannot execute skill while boss is idle",
        () => {
            const controller =
                createController();

            const result =
                controller.executeSkill(
                    "skill1",
                    1000,
                    0.8,
                    0
                );

            expect(
                result.success
            ).toBe(false);

            expect(
                result.finalDamage
            ).toBe(0);

            expect(
                result.skillResult.damage
            ).toBe(0);
        }
    );

    test(
        "cannot use skill while boss is idle",
        () => {
            const controller =
                createController();

            expect(
                controller.canUseSkill(
                    "skill1",
                    1000
                )
            ).toBe(false);
        }
    );

    test(
        "cannot start combat after boss is defeated",
        () => {
            const controller =
                createController();

            const boss =
                controller.getBoss();

            boss.takeDamage(999);

            expect(
                boss.getState()
            ).toBe("defeated");

            expect(
                controller.startCombat()
            ).toBe(false);

            expect(
                controller.isCombatActive()
            ).toBe(false);
        }
    );

    test(
        "cannot execute normal attack after boss is defeated",
        () => {
            const controller =
                createController();

            const boss =
                controller.getBoss();

            boss.takeDamage(999);

            const result =
                controller.executeNormalAttack(0);

            expect(
                result.success
            ).toBe(false);

            expect(
                result.finalDamage
            ).toBe(0);
        }
    );

    test(
        "cannot execute skill after boss is defeated",
        () => {
            const controller =
                createController();

            const boss =
                controller.getBoss();

            boss.takeDamage(999);

            const result =
                controller.executeSkill(
                    "skill1",
                    1000,
                    0.8,
                    0
                );

            expect(
                result.success
            ).toBe(false);

            expect(
                result.finalDamage
            ).toBe(0);
        }
    );

    test(
        "cannot use skill after boss is defeated",
        () => {
            const controller =
                createController();

            const boss =
                controller.getBoss();

            boss.takeDamage(999);

            expect(
                controller.canUseSkill(
                    "skill1",
                    1000
                )
            ).toBe(false);
        }
    );

    test(
        "cannot update boss phase while combat is inactive",
        () => {
            const controller =
                createController();

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
                controller.getBoss()
                    .getCurrentPhase()
            ).toBe(1);
        }
    );

    test(
        "boss phase does not change before threshold",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(100);

            expect(
                boss.getHpPercentage()
            ).toBeCloseTo(2 / 3);

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
        "boss advances to phase 2 at threshold",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            expect(
                boss.getHpPercentage()
            ).toBe(0.5);

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
        "boss phase does not advance twice",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            const firstResult =
                controller.updateBossPhase();

            expect(
                firstResult.changed
            ).toBe(true);

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

            expect(
                boss.getCurrentPhase()
            ).toBe(2);
        }
    );

    test(
        "defeated boss cannot update phase",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(999);

            expect(
                boss.getState()
            ).toBe("defeated");

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
        "executes normal attack in phase 1",
        () => {
            const controller =
                createActiveController();

            const result =
                controller.executeNormalAttack(0);

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.success
            ).toBe(true);

            expect(
                result.skillResult.skillId
            ).toBe("normal");

            expect(
                result.skillResult.damage
            ).toBe(10);

            expect(
                result.skillResult.critical
            ).toBe(false);

            expect(
                result.finalDamage
            ).toBe(10);
        }
    );

    test(
        "applies target armor to normal attack",
        () => {
            const controller =
                createActiveController();

            const result =
                controller.executeNormalAttack(2);

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.damage
            ).toBe(10);

            expect(
                result.finalDamage
            ).toBe(5);
        }
    );

    test(
        "normal attack damage does not use skill cooldown",
        () => {
            const controller =
                createActiveController();

            const firstResult =
                controller.executeNormalAttack(0);

            const secondResult =
                controller.executeNormalAttack(0);

            expect(
                firstResult.success
            ).toBe(true);

            expect(
                secondResult.success
            ).toBe(true);

            expect(
                firstResult.finalDamage
            ).toBe(10);

            expect(
                secondResult.finalDamage
            ).toBe(10);
        }
    );

    test(
        "normal attack is not critical",
        () => {
            const controller =
                createActiveController();

            const result =
                controller.executeNormalAttack(0);

            expect(
                result.skillResult.critical
            ).toBe(false);
        }
    );

    test(
        "normal attack respects target armor",
        () => {
            const controller =
                createActiveController();

            const result =
                controller.executeNormalAttack(4);

            expect(
                result.finalDamage
            ).toBe(0);
        }
    );

    test(
        "executes skill 1 in phase 1",
        () => {
            const controller =
                createActiveController();

            const result =
                controller.executeSkill(
                    "skill1",
                    1000,
                    0.8,
                    0
                );

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.success
            ).toBe(true);

            expect(
                result.skillResult.skillId
            ).toBe("skill1");

            expect(
                result.skillResult.damage
            ).toBe(20);

            expect(
                result.finalDamage
            ).toBe(20);
        }
    );

    test(
        "can use skill when combat is active",
        () => {
            const controller =
                createActiveController();

            expect(
                controller.canUseSkill(
                    "skill1",
                    1000
                )
            ).toBe(true);
        }
    );

    test(
        "skill still respects cooldown when combat is active",
        () => {
            const controller =
                createActiveController();

            const firstResult =
                controller.executeSkill(
                    "skill1",
                    1000,
                    0.8,
                    0
                );

            const secondResult =
                controller.executeSkill(
                    "skill1",
                    2000,
                    0.8,
                    0
                );

            expect(
                firstResult.success
            ).toBe(true);

            expect(
                secondResult.success
            ).toBe(false);

            expect(
                secondResult.finalDamage
            ).toBe(0);
        }
    );

    test(
        "allows skill after cooldown while combat is active",
        () => {
            const controller =
                createActiveController();

            controller.executeSkill(
                "skill1",
                1000,
                0.8,
                0
            );

            const result =
                controller.executeSkill(
                    "skill1",
                    4000,
                    0.8,
                    0
                );

            expect(
                result.success
            ).toBe(true);

            expect(
                result.finalDamage
            ).toBe(20);
        }
    );

    test(
        "phase 2 increases normal attack damage",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            const phaseResult =
                controller.updateBossPhase();

            expect(
                phaseResult.changed
            ).toBe(true);

            const result =
                controller.executeNormalAttack(0);

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.damage
            ).toBe(12);

            expect(
                result.finalDamage
            ).toBe(12);
        }
    );

    test(
        "phase 2 uses phase-specific skill 1 multiplier",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            const phaseResult =
                controller.updateBossPhase();

            expect(
                phaseResult.changed
            ).toBe(true);

            const result =
                controller.executeSkill(
                    "skill1",
                    1000,
                    0.8,
                    0
                );

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.damage
            ).toBe(25);

            expect(
                result.finalDamage
            ).toBe(25);
        }
    );

    test(
        "phase 2 uses phase-specific skill 2 multiplier",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            const phaseResult =
                controller.updateBossPhase();

            expect(
                phaseResult.changed
            ).toBe(true);

            const result =
                controller.executeSkill(
                    "skill2",
                    1000,
                    0.8,
                    0
                );

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.damage
            ).toBe(40);

            expect(
                result.finalDamage
            ).toBe(40);
        }
    );

    test(
        "phase 2 critical skill 1 uses phase multiplier",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            controller.updateBossPhase();

            const result =
                controller.executeSkill(
                    "skill1",
                    1000,
                    0.2,
                    0
                );

            expect(
                result.success
            ).toBe(true);

            expect(
                result.skillResult.critical
            ).toBe(true);

            expect(
                result.skillResult.damage
            ).toBe(42.5);

            expect(
                result.finalDamage
            ).toBe(42.5);
        }
    );

    test(
        "returns boss attack from combat system",
        () => {
            const controller =
                createController();

            expect(
                controller.getBossAttack()
            ).toBe(10);
        }
    );

    test(
        "returns phase-scaled boss attack after phase transition",
        () => {
            const controller =
                createActiveController();

            const boss =
                controller.getBoss();

            boss.takeDamage(150);

            controller.updateBossPhase();

            expect(
                controller.getBossAttack()
            ).toBe(12);
        }
    );

    test(
        "returns the controlled boss",
        () => {
            const controller =
                createController();

            const boss =
                controller.getBoss();

            expect(
                boss
            ).toBeInstanceOf(Boss1);

            expect(
                boss.getName()
            ).toBe("Boss 1");
        }
    );
});