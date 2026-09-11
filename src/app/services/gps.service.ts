import { Injectable } from '@angular/core';
import { Capacitor, registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  Location as BackgroundLocation,
} from '@capacitor-community/background-geolocation';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject } from 'rxjs';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation',
);

/**
 * Service de gestion de la localisation GPS.
 * Il centralise la demande de permission, le suivi de la position
 * et la diffusion des nouvelles coordonnées pour le reste de l'application.
 */
@Injectable({
  providedIn: 'root',
})
export class GpsService {
  // Stocke la dernière position connue et permet de la transmettre aux abonnés.
  private positionSubject = new BehaviorSubject<Position | null>(null);

  // Observable public exposé aux composants et services consommateurs.
  position$ = this.positionSubject.asObservable();

  // Identifiant de la surveillance GPS active, permettant d'éviter les doublons.
  private watchId: string | null = null;

  /**
   * Démarre la surveillance GPS.
   * La méthode vérifie d'abord si un suivi est déjà actif pour éviter des doublons.
   *
   * @returns Une Promise résolue après la demande de permission et l'installation du suivi GPS.
   */
  async start(): Promise<void> {
    if (this.watchId !== null) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      this.watchId = await BackgroundGeolocation.addWatcher(
        {
          backgroundTitle: 'Zig zig zigounette au vent',
          backgroundMessage: 'Enregistrement du trajet en cours.',
          requestPermissions: true,
          stale: false,
          distanceFilter: 0,
        },
        (location, error) => {
          if (error) {
            console.error('Erreur GPS en arrière-plan :', error);
            return;
          }

          if (location) {
            this.positionSubject.next(this.toCapacitorPosition(location));
          }
        },
      );
    } else {
      await Geolocation.requestPermissions();
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 1000,
        },
        (position, error) => {
          if (error) {
            console.error('Erreur GPS :', error);
            return;
          }

          if (position) {
            this.positionSubject.next(position);
          }
        },
      );
    }

    console.log('GPS lancé');
  }

  /**
   * Arrête la surveillance GPS active.
   *
   * @returns Une Promise résolue lorsque le suivi GPS a été supprimé.
   */
  async stop(): Promise<void> {
    if (this.watchId === null) {
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await BackgroundGeolocation.removeWatcher({ id: this.watchId });
    } else {
      await Geolocation.clearWatch({ id: this.watchId });
    }

    this.watchId = null;
    console.log('GPS arrêté');
  }

  private toCapacitorPosition(location: BackgroundLocation): Position {
    return {
      coords: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        altitude: location.altitude,
        altitudeAccuracy: location.altitudeAccuracy,
        heading: location.bearing,
        speed: location.speed,
      },
      timestamp: location.time ?? Date.now(),
    };
  }
}
