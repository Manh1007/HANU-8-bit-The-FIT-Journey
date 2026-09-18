import Phaser from "phaser";
import { locationManager } from "../systems/LocationManager";
import { MapManager } from "../systems/MapManager";
import { Player } from "../entities/Player";
import { PlayerController } from "../systems/PlayerController";

export class CampusScene extends Phaser.Scene {
    
    private player!: Player;
    private playerController!: PlayerController;

    constructor() {
        super("CampusScene");
    }

    create(): void {
        const { width, height } = this.scale;

        this.physics.world.setBounds(
            0,
            0,
            1280,
            720
        );

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

        this.player = new Player(
            this,
            400,
            300
        );

        this.cameras.main.startFollow(
            this.player.sprite,
            true
        );

        const obstacle =
            this.physics.add.staticImage(
                500,
                300,
                "player"
            );

        obstacle.setDisplaySize(64, 64);
        obstacle.refreshBody();

        this.physics.add.collider(
            this.player.sprite,
            obstacle
        );

        this.playerController = new PlayerController(
            this,
            this.player
        );

        const mapManager = new MapManager(this);

        const nhaCUnlocked =
            locationManager.isUnlocked("nha-c");

        const nhaCButton = this.add
            .text(
                width / 2,
                height / 2 + 100,
                nhaCUnlocked
                    ? "[ VÀO NHÀ C ]"
                    : "[ NHÀ C - KHÓA ]",
                {
                    fontFamily: "Arial",
                    fontSize: "28px",
                    color: "#ffffff",
                    backgroundColor: "#16213e",
                    padding: {
                        left: 25,
                        right: 25,
                        top: 15,
                        bottom: 15,
                    },
                }
            )
            .setOrigin(0.5);

        if (nhaCUnlocked) {
            nhaCButton.setInteractive({ useHandCursor: true });

            nhaCButton.on("pointerdown", () => {
                mapManager.goToMap("NhaCScene");
            });
        }
    }

    update(): void {
    this.playerController.update();
    }
}