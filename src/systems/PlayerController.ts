import Phaser from "phaser";
import { Player } from "../entities/Player";

export class PlayerController {
    private player: Player;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private keys: {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };

    private speed: number;

    constructor(
        scene: Phaser.Scene,
        player: Player,
        speed: number = 160
    ) {
        this.player = player;
        this.speed = speed;

        this.cursors = scene.input.keyboard!.createCursorKeys();

        this.keys = scene.input.keyboard!.addKeys(
            "W,A,S,D"
        ) as {
            W: Phaser.Input.Keyboard.Key;
            A: Phaser.Input.Keyboard.Key;
            S: Phaser.Input.Keyboard.Key;
            D: Phaser.Input.Keyboard.Key;
        };
    }

    update(): void {
        let velocityX = 0;
        let velocityY = 0;

        if (
            this.cursors.left.isDown ||
            this.keys.A.isDown
        ) {
            velocityX = -this.speed;
        }

        if (
            this.cursors.right.isDown ||
            this.keys.D.isDown
        ) {
            velocityX = this.speed;
        }

        if (
            this.cursors.up.isDown ||
            this.keys.W.isDown
        ) {
            velocityY = -this.speed;
        }

        if (
            this.cursors.down.isDown ||
            this.keys.S.isDown
        ) {
            velocityY = this.speed;
        }

        this.player.setVelocity(
            velocityX,
            velocityY
        );

        if (velocityX !== 0 || velocityY !== 0) {
            this.player.body.velocity.normalize().scale(this.speed);
        }
    }
}