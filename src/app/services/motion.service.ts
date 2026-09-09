import { Injectable } from '@angular/core';
import { Motion } from '@capacitor/motion';
import type { PluginListenerHandle } from '@capacitor/core';
import { BehaviorSubject } from 'rxjs';
/**
 * Représente les données captées par les capteurs de mouvement.
 */
export interface MotionData {
  initAccelerationX: number;
  initAccelerationY: number;
  initAccelerationZ: number;

  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;

  initOrientationAlpha: number;
  initOrientationBeta: number;
  initOrientationGamma: number;

  orientationAlpha: number;
  orientationBeta: number;
  orientationGamma: number;
}

@Injectable({
  providedIn: 'root',
})
export class MotionService {
  // =========================
  // DONNÉES
  // =========================

  private motionSubject = new BehaviorSubject<MotionData>(
    this.createInitialData(),
  );

  motion$ = this.motionSubject.asObservable();

  private currentData: MotionData = this.createInitialData();

  // =========================
  // ÉTAT
  // =========================

  private isRunning = false;

  private isInitAcceleration = false;
  private isInitOrientation = false;

  // =========================
  // LISTENERS
  // =========================

  private accelerationListener: PluginListenerHandle | null = null;

  private orientationListener: PluginListenerHandle | null = null;

  /**
   * Active l'écoute des capteurs.
    *
    * @returns Une Promise résolue après l'installation des listeners d'accélération et d'orientation.
   */
  async start(): Promise<void> {
    // Empêche l'ajout de listeners en double
    if (this.isRunning) {
      console.log('Motion déjà lancé');
      return;
    }

    console.log('=== DÉMARRAGE MOTION ===');

    // Remise à zéro pour un nouveau trajet
    this.resetCalibration();

    // Important :
    // On passe l'état à true avant d'ajouter les listeners.
    this.isRunning = true;

    // =========================
    // ACCÉLÉRATION
    // =========================

    this.accelerationListener = await Motion.addListener('accel', (event) => {
      if (!this.isRunning) {
        return;
      }

      const acceleration = event.accelerationIncludingGravity;

      const x = acceleration?.x ?? 0;
      const y = acceleration?.y ?? 0;
      const z = acceleration?.z ?? 0;

      // Première mesure = référence
      if (!this.isInitAcceleration) {
        this.currentData = {
          ...this.currentData,

          initAccelerationX: x,
          initAccelerationY: y,
          initAccelerationZ: z,

          accelerationX: 0,
          accelerationY: 0,
          accelerationZ: 0,
        };

        this.isInitAcceleration = true;
      }

      // Valeur relative au départ
      this.currentData = {
        ...this.currentData,

        accelerationX: x ,

        accelerationY: y ,

        accelerationZ: z ,
      };

      this.motionSubject.next(this.currentData);
    });

    // =========================
    // ORIENTATION
    // =========================

    this.orientationListener = await Motion.addListener(
      'orientation',
      (event) => {
        if (!this.isRunning) {
          return;
        }

        const alpha = event.alpha ?? 0;
        const beta = event.beta ?? 0;
        const gamma = event.gamma ?? 0;

        // Première mesure = référence
        if (!this.isInitOrientation) {
          this.currentData = {
            ...this.currentData,

            initOrientationAlpha: alpha,
            initOrientationBeta: beta,
            initOrientationGamma: gamma,

            orientationAlpha: 0,
            orientationBeta: 0,
            orientationGamma: 0,
          };

          this.isInitOrientation = true;
        }

        this.currentData = {
          ...this.currentData,

          orientationAlpha: alpha,
          orientationBeta: beta,
          orientationGamma: gamma,
          // orientationAlpha: this.normalizeDelta(
          //   alpha,
          //   this.currentData.initOrientationAlpha,
          // ),

          // orientationBeta: this.normalizeDelta(
          //   beta,
          //   this.currentData.initOrientationBeta,
          // ),

          // orientationGamma: this.normalizeDelta(
          //   gamma,
          //   this.currentData.initOrientationGamma,
          // ),
        };

        this.motionSubject.next(this.currentData);
      },
    );

    console.log('Motion lancé');
  }

  /**
   * Désactive les listeners créés par ce service.
    *
    * @returns Une Promise résolue après la suppression des listeners et la réinitialisation des données.
   */
  async stop(): Promise<void> {
    console.log('=== ARRÊT MOTION ===');

    // On désactive immédiatement le traitement
    this.isRunning = false;

    // Supprime le listener accélération
    if (this.accelerationListener) {
      await this.accelerationListener.remove();

      this.accelerationListener = null;
    }

    // Supprime le listener orientation
    if (this.orientationListener) {
      await this.orientationListener.remove();

      this.orientationListener = null;
    }

    // Réinitialisation pour le prochain trajet
    this.resetCalibration();

    console.log('Motion arrêté');
  }

  // =========================
  // CALIBRATION
  // =========================

  private resetCalibration(): void {
    this.isInitAcceleration = false;
    this.isInitOrientation = false;

    this.currentData = this.createInitialData();

    this.motionSubject.next(this.currentData);
  }

  // =========================
  // VALEURS INITIALES
  // =========================

  private createInitialData(): MotionData {
    return {
      initAccelerationX: 0,
      initAccelerationY: 0,
      initAccelerationZ: 0,

      accelerationX: 0,
      accelerationY: 0,
      accelerationZ: 0,

      initOrientationAlpha: 0,
      initOrientationBeta: 0,
      initOrientationGamma: 0,

      orientationAlpha: 0,
      orientationBeta: 0,
      orientationGamma: 0,
    };
  }

  // =========================
  // UTILITAIRES
  // =========================

  /**
   * Normalise un écart angulaire pour éviter
   * un saut entre 359° et 0°.
    *
    * @param current Angle courant en degrés.
    * @param initial Angle de référence en degrés.
    * @returns L'écart angulaire signé compris entre -180 et 180 degrés.
   */
  private normalizeDelta(current: number, initial: number): number {
    let delta = current - initial;

    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    return delta;
  }
}
