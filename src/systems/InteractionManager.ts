import Phaser from "phaser";
import { Player } from "../entities/Player";
import { MapManager } from "./MapManager";

export class InteractionManager {
    private scene: Phaser.Scene;
    private player: Player;
    private objectsLayer: Phaser.Tilemaps.ObjectLayer;
    private entranceObject?: Phaser.Tilemaps.TiledObject;
    private interactionDistance = 50;
    private interactionText?: Phaser.GameObjects.Text;
    private mapManager: MapManager;
    private canInteract = false;

    constructor(
        scene: Phaser.Scene,
        player: Player,
        objectsLayer: Phaser.Tilemaps.ObjectLayer
    ) {
        this.scene = scene;
        this.player = player;
        this.objectsLayer = objectsLayer;
        this.mapManager = new MapManager(scene);
        this.scene.input.keyboard?.on(
            "keydown-E",
            this.interact,
            this
        );
        this.entranceObject = this.objectsLayer.objects.find(
            (object) => object.name === "NhaCEntrance"
        );
        if (!this.entranceObject) {
            console.warn("NhaCEntrance not found");
        }

        this.interactionText = this.scene.add
            .text(
                this.scene.scale.width / 2,
                this.scene.scale.height - 80,
                "[ E ] Vào Nhà C",
                {
                    fontFamily: "Arial",
                    fontSize: "24px",
                    color: "#ffffff",
                    backgroundColor: "#16213e",
                    padding: {
                        left: 20,
                        right: 20,
                        top: 10,
                        bottom: 10,
                    },
                }
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000);

        this.interactionText.setVisible(false);
    }

    update(): void {
        if (!this.entranceObject) {
            return;
        }

        const playerX = this.player.sprite.x;
        const playerY = this.player.sprite.y;

        const entranceX =
            (this.entranceObject.x ?? 0) +
            (this.entranceObject.width ?? 0) / 2;

        const entranceY =
            (this.entranceObject.y ?? 0) +
            (this.entranceObject.height ?? 0) / 2;

        const distance = Phaser.Math.Distance.Between(
            playerX,
            playerY,
            entranceX,
            entranceY
        );

        if (distance <= this.interactionDistance) {
            this.canInteract = true;
            this.interactionText?.setVisible(true);
        } else {
            this.canInteract = false;
            this.interactionText?.setVisible(false);
        }
    }

    private interact(): void {
        if (!this.canInteract || !this.entranceObject) {
            return;
        }

        const targetScene = this.entranceObject.properties?.find(
            (property) => property.name === "targetScene"
        );

        if (!targetScene) {
            console.warn(
                "NhaCEntrance does not have targetScene property"
            );
            return;
        }

        this.mapManager.goToMap(targetScene.value);
    }
}