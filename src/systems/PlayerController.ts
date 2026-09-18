import Phaser from "phaser";
import {
    Player,
    PlayerDirection
} from "../entities/Player";
import { AnimationController } from "./AnimationController";

export class PlayerController {
    private player: Player;
    private animationController: AnimationController;

    private cursors:
        Phaser.Types.Input.Keyboard.CursorKeys;

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
        this.animationController = new AnimationController(player);
        this.speed = speed;

        this.cursors =
            scene.input.keyboard!.createCursorKeys();

        this.keys =
            scene.input.keyboard!.addKeys(
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

        /*
         * Horizontal movement
         */
        if (
            this.cursors.left.isDown ||
            this.keys.A.isDown
        ) {
            velocityX = -this.speed;

            this.player.setFacingDirection(
                PlayerDirection.LEFT
            );
        }

        if (
            this.cursors.right.isDown ||
            this.keys.D.isDown
        ) {
            velocityX = this.speed;

            this.player.setFacingDirection(
                PlayerDirection.RIGHT
            );
        }

        /*
         * Vertical movement
         */
        if (
            this.cursors.up.isDown ||
            this.keys.W.isDown
        ) {
            velocityY = -this.speed;

            this.player.setFacingDirection(
                PlayerDirection.UP
            );
        }

        if (
            this.cursors.down.isDown ||
            this.keys.S.isDown
        ) {
            velocityY = this.speed;

            this.player.setFacingDirection(
                PlayerDirection.DOWN
            );
        }

        /*
         * Apply movement
         */
        this.player.setVelocity(
            velocityX,
            velocityY
        );

        /*
         * Prevent diagonal movement
         * from being faster.
         */
        const isMoving =
            velocityX !== 0 ||
            velocityY !== 0;

        if (isMoving) {
            this.player.body.velocity
                .normalize()
                .scale(this.speed);
        }

        this.animationController.update(
            isMoving
        );
    }
}