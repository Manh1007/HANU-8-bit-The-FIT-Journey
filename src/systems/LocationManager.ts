import { gameState } from "../game/GameState";
import {LOCATIONS, type LocationDefinition,} from "../game/Location";

export class LocationManager {
    getLocation(locationId: string): LocationDefinition | undefined {
        return LOCATIONS.find(
            (location) => location.id === locationId
        );
    }

    isUnlocked(locationId: string): boolean {
        return gameState.isLocationUnlocked(locationId);
    }

    unlock(locationId: string): void {
        const location = this.getLocation(locationId);

        if (!location) {
            console.warn(
                `Location "${locationId}" does not exist.`
            );
            return;
        }

        gameState.unlockLocation(locationId);
    }

    getUnlockedLocations(): LocationDefinition[] {
        return LOCATIONS.filter(
            (location) => this.isUnlocked(location.id)
        );
    }
}

export const locationManager = new LocationManager();