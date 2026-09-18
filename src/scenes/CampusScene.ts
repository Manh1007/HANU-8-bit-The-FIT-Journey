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