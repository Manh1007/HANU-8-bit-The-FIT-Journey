import Phaser from "phaser";

export class MapManager {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    goToMap(sceneKey: string): void {
        this.scene.scene.start(sceneKey);
    }
}