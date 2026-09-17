import Phaser from "phaser";
import { gameState } from "../game/GameState";

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("MainMenuScene");
    }

    create(): void {
        console.log("Current Game State:");
        console.log(gameState.getData());

        gameState.startQuest("MQ_001");

        console.log("After starting MQ_001:");
        console.log(gameState.getData());

        gameState.completeQuest("MQ_001");
        gameState.unlockLocation("nha-c");
        gameState.addMemory("memory_first_day");
        gameState.addXP(100);

        console.log("After progression:");
        console.log(gameState.getData());

        const { width, height } = this.scale;

        this.add
            .text(width / 2, height / 2 - 80, "FIT HANU", {
                fontFamily: "Arial",
                fontSize: "64px",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(
                width / 2,
                height / 2,
                "20 NĂM LẬP TRÌNH TƯƠNG LAI",
                {
                    fontFamily: "Arial",
                    fontSize: "28px",
                    color: "#ffffff",
                }
            )
            .setOrigin(0.5);

        this.add
            .text(width / 2, height / 2 + 100, "BẮT ĐẦU", {
                fontFamily: "Arial",
                fontSize: "32px",
                color: "#ffffff",
                backgroundColor: "#16213e",
                padding: {
                    left: 30,
                    right: 30,
                    top: 15,
                    bottom: 15,
                },
            })
            .setOrigin(0.5);
    }
}