import {
    EnemyController,
    type EnemyControllerConfig,
    type EnemyPosition,
    type EnemyUpdateResult,
} from "./EnemyController";
import { Enemy, type EnemyData } from "../entities/Enemy";

export interface ManagedEnemy {
    id: string;
    controller: EnemyController;
}

/**
 * EnemyManager — manages a collection of EnemyControllers in a scene/area.
 *
 * Responsibilities:
 * - Spawn enemies from data definitions
 * - Tick all alive enemies each frame
 * - Remove dead enemies
 * - Query enemies by state or proximity
 */
export class EnemyManager {
    private enemies: Map<string, EnemyController> = new Map();

    // ============================================================
    // Spawn / Remove
    // ============================================================

    /**
     * Spawn a new enemy from data.
     * Returns the controller for the spawned enemy.
     */
    spawn(
        data: EnemyData,
        position: EnemyPosition,
        config?: EnemyControllerConfig
    ): EnemyController {
        const enemy = new Enemy(data);
        const controller = new EnemyController(enemy, position, config);
        this.enemies.set(data.id, controller);
        return controller;
    }

    /**
     * Remove an enemy by ID.
     */
    remove(enemyId: string): boolean {
        return this.enemies.delete(enemyId);
    }

    /**
     * Remove all dead enemies from the registry.
     * Returns the IDs of removed enemies.
     */
    removeDead(): string[] {
        const removed: string[] = [];

        for (const [id, controller] of this.enemies) {
            if (controller.isDead()) {
                this.enemies.delete(id);
                removed.push(id);
            }
        }

        return removed;
    }

    /**
     * Clear all enemies.
     */
    clear(): void {
        this.enemies.clear();
    }

    // ============================================================
    // Update
    // ============================================================

    /**
     * Tick all alive enemies.
     * Returns a map of enemy ID → update result for enemies that acted this frame.
     */
    updateAll(
        dt: number,
        currentTime: number,
        playerPos: EnemyPosition | null
    ): Map<string, EnemyUpdateResult> {
        const results = new Map<string, EnemyUpdateResult>();

        for (const [id, controller] of this.enemies) {
            if (controller.isDead()) {
                continue;
            }

            const result = controller.update(dt, currentTime, playerPos);
            results.set(id, result);
        }

        return results;
    }

    // ============================================================
    // Queries
    // ============================================================

    getController(enemyId: string): EnemyController | undefined {
        return this.enemies.get(enemyId);
    }

    getAllControllers(): EnemyController[] {
        return Array.from(this.enemies.values());
    }

    getAliveControllers(): EnemyController[] {
        return this.getAllControllers().filter((c) => !c.isDead());
    }

    count(): number {
        return this.enemies.size;
    }

    aliveCount(): number {
        return this.getAliveControllers().length;
    }

    /**
     * Find the nearest alive enemy to a position.
     */
    getNearestTo(
        position: EnemyPosition
    ): EnemyController | null {
        let nearest: EnemyController | null = null;
        let minDist = Infinity;

        for (const controller of this.getAliveControllers()) {
            const dist = controller.distanceTo(position);
            if (dist < minDist) {
                minDist = dist;
                nearest = controller;
            }
        }

        return nearest;
    }

    /**
     * Get all enemies within a given distance of a position.
     */
    getEnemiesInRange(
        position: EnemyPosition,
        range: number
    ): EnemyController[] {
        return this.getAliveControllers().filter(
            (c) => c.distanceTo(position) <= range
        );
    }
}
