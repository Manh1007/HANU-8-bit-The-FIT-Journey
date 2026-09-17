import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload(): void {
        console.log("PreloadScene started");
    }

    create(): void {
        this.scene.start("MainMenuScene");
    }
}