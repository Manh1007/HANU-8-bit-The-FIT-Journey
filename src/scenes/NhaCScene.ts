import Phaser from "phaser";

export class NhaCScene extends Phaser.Scene {
    constructor() {
        super("NhaCScene");
    }

    create(): void {
        const { width, height } = this.scale;

        this.add
            .text(width / 2, height / 2 - 80, "NHÀ C", {
                fontFamily: "Arial",
                fontSize: "64px",
                color: "#ffffff",
            })
            .setOrigin(0.5);

        this.add
            .text(
                width / 2,
                height / 2,
                "MAP NHÀ C",
                {
                    fontFamily: "Arial",
                    fontSize: "32px",
                    color: "#ffffff",
                }
            )
            .setOrigin(0.5);
    }
}