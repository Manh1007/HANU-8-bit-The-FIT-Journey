import { describe, expect, test } from "vitest";

import { Boss1 } from "../bosses/Boss1";
import { BossCombatSystem } from "../systems/BossCombatSystem";
import { BossSkillSystem } from "../systems/BossSkillSystem";
import { BossCombatController } from "../systems/BossCombatController";
import { DamageSystem } from "../systems/DamageSystem";

describe("BossPhaseResult", () => {
    function createController() {
        const boss = new Boss1();

        const combatSystem =
            new BossCombatSystem(
                boss,
                boss.getCombatData()
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
                boss.getCombatData()
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

            expect(result.changed)
                .toBe(false);

            expect(result.previousPhase)
                .toBe(1);

            expect(result.currentPhase)
                .toBe(1);

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

            expect(result.changed)
                .toBe(false);

            expect(result.previousPhase)
                .toBe(1);

            expect(result.currentPhase)
                .toBe(1);
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

            expect(result.changed)
                .toBe(true);

            expect(result.previousPhase)
                .toBe(1);

            expect(result.currentPhase)
                .toBe(2);

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

            expect(firstResult.changed)
                .toBe(true);

            const secondResult =
                controller.updateBossPhase();

            expect(secondResult.changed)
                .toBe(false);

            expect(secondResult.previousPhase)
                .toBe(2);

            expect(secondResult.currentPhase)
                .toBe(2);
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

            expect(result.changed)
                .toBe(false);

            expect(result.previousPhase)
                .toBe(1);

            expect(result.currentPhase)
                .toBe(1);

            expect(
                boss.isDead()
            ).toBe(true);
        }
    );
}); 