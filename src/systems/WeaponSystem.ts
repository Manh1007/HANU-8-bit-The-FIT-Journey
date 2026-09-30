export type WeaponId =
    | "keyboard";

export interface WeaponData {
    id: WeaponId;
    name: string;
    baseDamage: number;
    attackRange: number;
    attackCooldown: number;
}

export class WeaponSystem {
    private readonly weapons: Map<WeaponId, WeaponData>;

    private equippedWeapon: WeaponId = "keyboard";

    constructor() {
        this.weapons = new Map<WeaponId, WeaponData>();

        this.registerWeapon({
            id: "keyboard",
            name: "Bàn phím",
            baseDamage: 5,
            attackRange: 40,
            attackCooldown: 400,
        });
    }

    private registerWeapon(weapon: WeaponData): void {
        this.weapons.set(weapon.id, weapon);
    }

    equipWeapon(weaponId: WeaponId): boolean {
        if (!this.weapons.has(weaponId)) {
            return false;
        }

        this.equippedWeapon = weaponId;

        return true;
    }

    getEquippedWeapon(): WeaponData {
        const weapon = this.weapons.get(
            this.equippedWeapon
        );

        if (!weapon) {
            throw new Error(
                `Weapon not found: ${this.equippedWeapon}`
            );
        }

        return weapon;
    }

    getDamage(): number {
        return this.getEquippedWeapon().baseDamage;
    }

    getAttackRange(): number {
        return this.getEquippedWeapon().attackRange;
    }

    getAttackCooldown(): number {
        return this.getEquippedWeapon().attackCooldown;
    }
}