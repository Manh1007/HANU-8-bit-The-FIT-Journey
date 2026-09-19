import Phaser from "phaser";
import { locationManager } from "../systems/LocationManager";
import { MapManager } from "../systems/MapManager";
import { Player } from "../entities/Player";
import { PlayerController } from "../systems/PlayerController";
import { InteractionManager } from "../systems/InteractionManager";

export class CampusScene extends Phaser.Scene {
    
    private player!: Player;
    private playerController!: PlayerController;
    private collisionGroup!: Phaser.Physics.Arcade.StaticGroup;
    private interactionManager!: InteractionManager;

    constructor() {
        super("CampusScene");
    }

    create(): void {
        const { width, height } = this.scale;

        // =========================
        // TILEMAP
        // =========================
        const map = this.make.tilemap({
            key: "campusMap"
        });

        this.cameras.main.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );
        
        // =========================
        // WORLD BOUNDS
        // =========================
        this.physics.world.setBounds(
            0,
            0,
            map.widthInPixels,
            map.heightInPixels
        );

        const tileset = map.addTilesetImage(
            "campusPlaceholder",
            "campusPlaceholder"
        );

        if (!tileset) {
            throw new Error("Failed to load campusPlaceholder tileset");
        }

        // =========================
        // TILEMAP LAYERS
        // =========================
        map.createLayer("Ground", tileset, 0, 0);
        map.createLayer("Decoration", tileset, 0, 0);

        // =========================
        // OBJECT LAYER
        // =========================
        const objectsLayer = map.getObjectLayer("Objects");

        const collisionLayer = map.getObjectLayer("Collision");

        if (!collisionLayer) {
            throw new Error("Collision layer not found");
        }

        if (!objectsLayer) {
            throw new Error("Objects layer not found");
        }

        this.collisionGroup = this.physics.add.staticGroup();

        collisionLayer.objects.forEach((object) => {
            if (
                object.width === undefined ||
                object.height === undefined
            ) {
                return;
            }

            const obstacle = this.add.rectangle(
                object.x + object.width / 2,
                object.y + object.height / 2,
                object.width,
                object.height,
                0x000000,
                0
            );

            this.collisionGroup.add(obstacle);
        });

        // =========================
        // PLAYER SPAWN
        // =========================
        const spawn = objectsLayer.objects.find(
            (object) => object.name === "PlayerSpawn"
        );

        if (!spawn) {
            throw new Error("PlayerSpawn object not found");
        }

        // =========================
        // PLAYER
        // =========================
        this.player = new Player(
            this,
            spawn.x ?? 0,
            spawn.y ?? 0
        );

        this.physics.add.collider(
            this.player.sprite,
            this.collisionGroup
        );

        this.interactionManager = new InteractionManager(
            this,
            this.player,
            objectsLayer
        );

        // =========================
        // CAMERA
        // =========================
        this.cameras.main.startFollow(
            this.player.sprite,
            true
        );

        // =========================
        // PLAYER CONTROLLER
        // =========================
        this.playerController = new PlayerController(
            this,
            this.player
        );

        // =========================
        // UI
        // =========================
        this.add
            .text(width / 2, 80, "KHUÔN VIÊN HANU", {
                fontFamily: "Arial",
                fontSize: "42px",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(
                width / 2,
                height / 2,
                "ĐÂY SẼ LÀ CAMPUS MAP",
                {
                    fontFamily: "Arial",
                    fontSize: "28px",
                    color: "#ffffff",
                }
            )
            .setOrigin(0.5);

        // =========================
        // MAP MANAGER
        // =========================
        const mapManager = new MapManager(this);
    }

    update(): void {
        this.playerController.update();
        this.interactionManager.update();
    }
}