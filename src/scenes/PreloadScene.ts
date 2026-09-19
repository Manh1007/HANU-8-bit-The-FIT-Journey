import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
    constructor() {
        super("PreloadScene");
    }

    preload(): void {
        console.log("PreloadScene started");
        this.load.tilemapTiledJSON(
            "campusMap",
            "/maps/campus/campus.tmj"
        );

        this.load.image(
            "campusPlaceholder",
            "/tilesets/campus-placeholder.png"
        );
    }

    create(): void {
        this.scene.start("MainMenuScene");
    }
}