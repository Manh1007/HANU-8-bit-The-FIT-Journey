import { BossBase } from "./BossBase";
import { Boss1 } from "./Boss1";
import { Boss2 } from "./Boss2";
import { Boss3 } from "./Boss3";
import type { BossCombatData } from "./BossCombatData";
import type { BossPhaseCombatData } from "./BossPhaseCombatData";
import { BossCombatSystem } from "../systems/BossCombatSystem";
import { BossSkillSystem, type BossSkillData } from "../systems/BossSkillSystem";
import { BossCombatController } from "../systems/BossCombatController";
import { BossPhaseBehavior } from "../systems/BossPhaseBehavior";
import { DamageSystem } from "../systems/DamageSystem";

export type BossId = "boss-1" | "boss-2" | "boss-3";

export interface BossDefinition {
    id: BossId;
    name: string;
    createInstance: () => BossBase & {
        getCombatData(): BossCombatData;
        getPhaseCombatData(): BossPhaseCombatData[];
        getSkillData(): BossSkillData[];
    };
    getCombatData: () => BossCombatData;
    getPhaseCombatData: () => BossPhaseCombatData[];
    getSkillData: () => BossSkillData[];
}

export class BossRegistry {
    private static readonly definitions: Map<BossId, BossDefinition> = new Map();

    static {
        BossRegistry.registerDefaultBosses();
    }

    private static registerDefaultBosses(): void {
        BossRegistry.register({
            id: "boss-1",
            name: "Boss 1",
            createInstance: () => new Boss1(),
            getCombatData: () => new Boss1().getCombatData(),
            getPhaseCombatData: () => new Boss1().getPhaseCombatData(),
            getSkillData: () => new Boss1().getSkillData(),
        });

        BossRegistry.register({
            id: "boss-2",
            name: "Boss 2",
            createInstance: () => new Boss2(),
            getCombatData: () => new Boss2().getCombatData(),
            getPhaseCombatData: () => new Boss2().getPhaseCombatData(),
            getSkillData: () => new Boss2().getSkillData(),
        });

        BossRegistry.register({
            id: "boss-3",
            name: "Boss 3",
            createInstance: () => new Boss3(),
            getCombatData: () => new Boss3().getCombatData(),
            getPhaseCombatData: () => new Boss3().getPhaseCombatData(),
            getSkillData: () => new Boss3().getSkillData(),
        });
    }

    static register(definition: BossDefinition): void {
        BossRegistry.definitions.set(definition.id, definition);
    }

    static hasBoss(id: string): boolean {
        return BossRegistry.definitions.has(id as BossId);
    }

    static getBossIds(): BossId[] {
        return Array.from(BossRegistry.definitions.keys());
    }

    static getDefinition(id: BossId | string): BossDefinition | undefined {
        return BossRegistry.definitions.get(id as BossId);
    }

    static createBoss(id: BossId | string): BossBase {
        const def = BossRegistry.getDefinition(id);
        if (!def) {
            throw new Error(`Unknown boss id: ${id}`);
        }
        return def.createInstance();
    }

    static createCombatController(
        id: BossId | string,
        damageSystem?: DamageSystem
    ): BossCombatController {
        const def = BossRegistry.getDefinition(id);
        if (!def) {
            throw new Error(`Unknown boss id: ${id}`);
        }

        const boss = def.createInstance();
        const combatData = boss.getCombatData();
        const phaseBehavior = new BossPhaseBehavior(boss.getPhaseCombatData());
        const combatSystem = new BossCombatSystem(boss, combatData, phaseBehavior);
        const skillSystem = new BossSkillSystem(boss.getSkillData());
        const ds = damageSystem ?? new DamageSystem();

        return new BossCombatController(
            boss,
            combatSystem,
            skillSystem,
            ds,
            combatData,
            phaseBehavior
        );
    }
}
