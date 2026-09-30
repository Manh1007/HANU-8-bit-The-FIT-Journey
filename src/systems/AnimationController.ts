import { Player } from "../entities/Player";
import type { PlayerDirection } from "../entities/Player";

export type PlayerAnimationState =
    | "idle"
    | "walking";

export class AnimationController {
    private player: Player;

    private currentState: PlayerAnimationState = "idle";

    constructor(player: Player) {
        this.player = player;
    }

    update(isMoving: boolean): void {
        if (isMoving) {
            this.currentState = "walking";
        } else {
            this.currentState = "idle";
        }

        this.updateAnimation();
    }

    private updateAnimation(): void {
        const direction =
            this.player.getFacingDirection();

        const animationKey =
            this.getAnimationKey(
                this.currentState,
                direction
            );

        /*
         * Animation thật sẽ được play ở đây
         * khi chúng ta có sprite sheet.
         */

        console.log(
            "Player animation:",
            animationKey
        );
    }

    private getAnimationKey(
        state: PlayerAnimationState,
        direction: PlayerDirection
    ): string {
        return `${state}_${direction}`;
    }
}