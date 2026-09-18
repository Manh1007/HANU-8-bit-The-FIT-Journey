import Phaser from "phaser";

export class Player {
    public readonly sprite: Phaser.Physics.Arcade.Sprite;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number
    ) {
        // Tạo texture placeholder nếu chưa tồn tại
        if (!scene.textures.exists("player")) {
            const graphics = scene.make.graphics({
                x: 0,
                y: 0
            });

            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 32, 32);

            graphics.generateTexture(
                "player",
                32,
                32
            );

            graphics.destroy();
        }

        // Tạo Arcade Physics Sprite
        this.sprite = scene.physics.add.sprite(
            x,
            y,
            "player"
        );

        // Cấu hình Player
        this.sprite.setDisplaySize(32, 32);

        // Không cho Player đi ra ngoài Physics World
        this.sprite.setCollideWorldBounds(true);

        // Player nằm trên background
        this.sprite.setDepth(10);
    }

    setVelocity(
        x: number,
        y: number
    ): void {
        this.sprite.setVelocity(x, y);
    }

    get body(): Phaser.Physics.Arcade.Body {
        return this.sprite.body as Phaser.Physics.Arcade.Body;
    }
}