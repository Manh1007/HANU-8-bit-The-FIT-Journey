export class PlayerStats {
    // =========================
    // Base stats
    // =========================

    private maxHp = 100;
    private hp = 100;

    private attack = 5;

    private maxStamina = 20;
    private stamina = 20;

    private armor = 10;

    private potion = 1;
    private readonly maxPotion = 5;

    // =========================
    // Upgrade values
    // =========================

    private readonly hpPerUpgrade = 20;
    private readonly attackPerUpgrade = 3;
    private readonly staminaPerUpgrade = 2;
    private readonly armorPerUpgrade = 2;

    // =========================
    // HP
    // =========================

    getHp(): number {
        return this.hp;
    }

    getMaxHp(): number {
        return this.maxHp;
    }

    // =========================
    // Attack
    // =========================

    getAttack(): number {
        return this.attack;
    }

    // =========================
    // Stamina
    // =========================

    getStamina(): number {
        return this.stamina;
    }

    getMaxStamina(): number {
        return this.maxStamina;
    }

    // =========================
    // Armor
    // =========================

    getArmor(): number {
        return this.armor;
    }

    // =========================
    // Potion
    // =========================

    getPotion(): number {
        return this.potion;
    }

    getMaxPotion(): number {
        return this.maxPotion;
    }

    // =========================
    // Upgrade
    // =========================

    upgradeHp(): void {
        this.maxHp += this.hpPerUpgrade;
        this.hp = this.maxHp;
    }

    upgradeAttack(): void {
        this.attack += this.attackPerUpgrade;
    }

    upgradeStamina(): void {
        this.maxStamina += this.staminaPerUpgrade;
        this.stamina = this.maxStamina;
    }

    upgradeArmor(): void {
        this.armor += this.armorPerUpgrade;
    }

    // =========================
    // Potion
    // =========================

    addPotion(amount: number = 1): void {
        this.potion = Math.min(
            this.potion + amount,
            this.maxPotion
        );
    }

    usePotion(): boolean {
        if (this.potion <= 0) {
            return false;
        }

        this.potion--;
        return true;
    }
}