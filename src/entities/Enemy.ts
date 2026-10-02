export interface EnemyData {
    id: string;
    name: string;
    maxHp: number;
    attack: number;
    armor: number;
}

export class Enemy {
    private readonly id: string;
    private readonly name: string;

    private readonly maxHp: number;
    private hp: number;

    private readonly attack: number;
    private armor: number;

    private alive = true;

    constructor(data: EnemyData) {
        this.id = data.id;
        this.name = data.name;

        this.maxHp = Math.max(0, data.maxHp);
        this.hp = this.maxHp;

        this.attack = Math.max(0, data.attack);
        this.armor = Math.max(0, data.armor);

        if (this.maxHp === 0) {
            this.alive = false;
        }
    }

    getId(): string {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getHp(): number {
        return this.hp;
    }

    getMaxHp(): number {
        return this.maxHp;
    }

    getAttack(): number {
        return this.attack;
    }

    getArmor(): number {
        return this.armor;
    }

    setArmor(amount: number): void {
        this.armor = Math.max(0, amount);
    }

    takeDamage(amount: number): number {
        if (!this.alive) {
            return 0;
        }

        const safeAmount = Math.max(0, amount);

        const previousHp = this.hp;

        this.hp = Math.max(
            0,
            this.hp - safeAmount
        );

        if (this.hp === 0) {
            this.alive = false;
        }

        return previousHp - this.hp;
    }

    isAlive(): boolean {
        return this.alive;
    }

    isDead(): boolean {
        return !this.alive;
    }

    getHpPercentage(): number {
        if (this.maxHp === 0) {
            return 0;
        }

        return this.hp / this.maxHp;
    }

    isFullHealth(): boolean {
        return this.hp === this.maxHp;
    }
}