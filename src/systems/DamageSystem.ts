export interface DamageResult {
    incomingDamage: number;
    armor: number;
    damageReduction: number;
    finalDamage: number;
}

export class DamageSystem {
    private readonly armorReductionPerPoint = 2.5;

    calculateDamage(
        incomingDamage: number,
        armor: number
    ): DamageResult {
        const safeDamage = Math.max(
            0,
            incomingDamage
        );

        const safeArmor = Math.max(
            0,
            armor
        );

        const damageReduction =
            safeArmor *
            this.armorReductionPerPoint;

        const finalDamage = Math.max(
            0,
            safeDamage - damageReduction
        );

        return {
            incomingDamage: safeDamage,
            armor: safeArmor,
            damageReduction,
            finalDamage,
        };
    }
}