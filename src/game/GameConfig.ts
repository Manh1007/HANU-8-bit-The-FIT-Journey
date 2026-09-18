import Phaser from "phaser";

import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { MainMenuScene } from "../scenes/MainMenuScene";
import { CampusScene } from "../scenes/CampusScene";
import { NhaCScene } from "../scenes/NhaCScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,

    width: 1280,
    height: 720,

    backgroundColor: "#1a1a2e",

    physics: {
        default: "arcade",

        arcade: {
            debug: true
        }
    },

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    scene: [
        BootScene,
        PreloadScene,
        MainMenuScene,
        CampusScene,
        NhaCScene,
    ],
};