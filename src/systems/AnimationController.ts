import { Player, PlayerDirection } from "../entities/Player";

export enum PlayerAnimationState {
    IDLE = "idle",
    WALKING = "walking"
}

export class AnimationController {
    private player: Player;

    private currentState: PlayerAnimationState =
        PlayerAnimationState.IDLE;

    constructor(player: Player) {
        this.player = player;
    }

    update(isMoving: boolean): void {
        if (isMoving) {
            this.currentState =
                PlayerAnimationState.WALKING;
        } else {
            this.currentState =
                PlayerAnimationState.IDLE;
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