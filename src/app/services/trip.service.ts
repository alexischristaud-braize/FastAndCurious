import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { TripMetrics } from '../models/trip-metrics';
import { GpsService } from './gps.service';
import { MotionService } from './motion.service';

/**
 * Service central de gestion du trajet.
 * Il orchestre les données GPS et de mouvement, calcule les statistiques,
 * gère le chronomètre et publie l'état courant pour l'interface utilisateur.
 */
@Injectable({
  providedIn: 'root',
})
export class TripService {
  // Flux principal des métriques du trajet. Il permet à l'UI de se synchroniser automatiquement.
  private metricsSubject = new BehaviorSubject<TripMetrics>(
    this.createInitialMetrics(),
  );

  metrics$ = this.metricsSubject.asObservable();

  // Snapshot actuelle des données de parcours, utilisée lors des calculs et de l'émission.
  private currentMetrics: TripMetrics = this.createInitialMetrics();

  // =========================
  // STATISTIQUES DE VITESSE
  // =========================

  // Somme des vitesses relevées pour calculer la vitesse moyenne.
  private speedSum = 0;
  private gpsCount = 0;

  // Nombre d'échantillons de vitesse utilisés pour le calcul moyen.
  private speedSampleCount = 0;

  // =========================
  // CHRONOMÈTRE ET POSITION
  // =========================

  // Instant de départ du parcours, utilisé pour calculer la durée écoulée.
  private startTime = 0;

  // Dernière position connue pour calculer la distance parcourue entre deux points.
  private previousLatitude: number | null = null;
  private previousLongitude: number | null = null;

  // Référence de l'intervalle de mise à jour du chronomètre.
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Construit le service et branche les flux GPS et de mouvement.
   *
   * @param gps Service qui fournit les positions GPS pendant le trajet.
   * @param motion Service qui fournit les mesures d'accélération et d'orientation.
   * @returns Rien. Les abonnements aux capteurs sont installés pendant la construction.
   */
  constructor(
    private gps: GpsService,
    private motion: MotionService,
  ) {
    // =========================
    // ABONNEMENT GPS
    // =========================
    this.gps.position$.subscribe((position) => {
      if (!position || !this.currentMetrics.isTracking) {
        return;
      }

      const speed = position.coords.speed ?? 0;

      this.speedSum += speed;
      this.speedSampleCount++;

      const averageSpeed = this.speedSum / this.speedSampleCount;
      const maxSpeed = Math.max(this.currentMetrics.maxSpeed, speed);

      this.currentMetrics = {
        ...this.currentMetrics,
        speed,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        maxSpeed,
        averageSpeed,
        gpsCount: this.speedSampleCount,
      };

      // =========================
      // CALCUL DE LA DISTANCE PARCOURUE
      // =========================

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      let additionalDistance = 0;

      if (this.previousLatitude !== null && this.previousLongitude !== null) {
        additionalDistance = this.calculateDistance(
          this.previousLatitude,
          this.previousLongitude,
          latitude,
          longitude,
        );
      }

      // La position actuelle devient la référence pour le prochain calcul.
      this.previousLatitude = latitude;
      this.previousLongitude = longitude;

      const distance = this.currentMetrics.distance + additionalDistance;
      this.currentMetrics.distance = distance;

      this.emitMetrics();
    });

    // =========================
    // ABONNEMENT MOUVEMENT
    // =========================

    this.motion.motion$.subscribe((motion) => {
      if (!this.currentMetrics.isTracking) {
        return;
      }

      this.currentMetrics = {
        ...this.currentMetrics,
        accelerationX: motion.accelerationX,
        accelerationY: motion.accelerationY,
        accelerationZ: motion.accelerationZ,
        orientationAlpha: motion.orientationAlpha,
        orientationBeta: motion.orientationBeta,
        orientationGamma: motion.orientationGamma,
      };

      this.emitMetrics();
    });
  }

  // =========================
  // DÉMARRAGE DU TRAJET
  // =========================

  /**
   * Réinitialise les métriques puis démarre le chronomètre et les capteurs.
   *
   * @returns Une Promise résolue lorsque le GPS et les capteurs de mouvement sont actifs.
   */
  async start(): Promise<void> {
    // Protection contre un double démarrage concurrent.
    if (this.currentMetrics.isTracking) {
      return;
    }

    console.log('=== DÉBUT DU TRAJET ===');

    // Remise à zéro des données de parcours avant un nouveau départ.
    this.reset();

    this.currentMetrics = {
      ...this.currentMetrics,
      isTracking: true,
    };

    // Timestamp de départ utilisé pour le chrono.
    this.startTime = Date.now();

    // Lancement du compteur de temps et des capteurs.
    this.startTimer();
    await this.gps.start();
    await this.motion.start();

    this.emitMetrics();
  }

  // =========================
  // ARRÊT DU TRAJET
  // =========================

  /**
   * Arrête le chronomètre et les capteurs, puis publie l'état final du trajet.
   *
   * @returns Une Promise résolue lorsque le GPS et les capteurs de mouvement sont arrêtés.
   */
  async stop(): Promise<void> {
    if (!this.currentMetrics.isTracking) {
      return;
    }

    console.log('=== FIN DU TRAJET ===');

    // Arrêt du chronomètre puis des capteurs.
    this.stopTimer();
    await this.gps.stop();
    await this.motion.stop();

    this.currentMetrics = {
      ...this.currentMetrics,
      isTracking: false,
      speed: 0,
    };

    this.emitMetrics();
  }

  // =========================
  // GESTION DU CHRONOMÈTRE
  // =========================

  /**
   * Lance la mise à jour périodique de la durée du trajet.
   *
   * @returns Rien. L'intervalle est conservé pour pouvoir être arrêté ensuite.
   */
  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (!this.currentMetrics.isTracking) {
        return;
      }

      const elapsedTime = Date.now() - this.startTime;

      this.currentMetrics = {
        ...this.currentMetrics,
        elapsedTime,
      };

      this.emitMetrics();
    }, 1000);
  }

  /**
   * Arrête l'intervalle de mise à jour du chronomètre s'il existe.
   *
   * @returns Rien.
   */
  private stopTimer(): void {
    if (this.timerInterval === null) {
      return;
    }

    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  // =========================
  // RÉINITIALISATION DU TRAJET
  // =========================

  /**
   * Remet à zéro les compteurs, la position précédente et les métriques courantes.
   *
   * @returns Rien. L'état initial est également publié aux abonnés.
   */
  private reset(): void {
    this.speedSum = 0;
    this.gpsCount = 0;
    this.speedSampleCount = 0;

    this.startTime = 0;
    this.previousLatitude = null;
    this.previousLongitude = null;

    this.currentMetrics = this.createInitialMetrics();
    this.emitMetrics();
  }

  // =========================
  // MÉTRIQUES INITIALES
  // =========================

  /**
   * Crée un objet de métriques avec toutes les valeurs initialisées à zéro.
   *
   * @returns Un nouvel état initial de type {@link TripMetrics}.
   */
  private createInitialMetrics(): TripMetrics {
    return {
      isTracking: false,

      speed: 0,
      latitude: 0,
      longitude: 0,

      maxSpeed: 0,
      averageSpeed: 0,
      elapsedTime: 0,
      gpsCount: 0,

      accelerationX: 0,
      accelerationY: 0,
      accelerationZ: 0,

      distance: 0,

      orientationAlpha: 0,
      orientationBeta: 0,
      orientationGamma: 0,
      
      accelerationLongitudinal: 0,
      accelerationLateral: 0,
      accelerationVertical: 0,

      gLongitudinal: 0,
      gLateral: 0,
      gVertical: 0,

      // Force totale ressentie
      gTotal: 0,
    };
  }

  // =========================
  // PUBLICATION DES DONNÉES
  // =========================

  /**
   * Publie les métriques courantes auprès des abonnés RxJS.
   *
   * @returns Rien.
   */
  private emitMetrics(): void {
    this.metricsSubject.next(this.currentMetrics);
  }

  /**
   * Calcule la distance entre deux coordonnées géographiques selon la formule haversine.
    *
    * @param latitude1 Latitude du premier point, en degrés.
    * @param longitude1 Longitude du premier point, en degrés.
    * @param latitude2 Latitude du second point, en degrés.
    * @param longitude2 Longitude du second point, en degrés.
    * @returns La distance entre les deux points, en mètres.
   */
  private calculateDistance(
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number,
  ): number {
    const earthRadius = 6371000;

    const lat1 = this.degreesToRadians(latitude1);
    const lat2 = this.degreesToRadians(latitude2);
    const deltaLatitude = this.degreesToRadians(latitude2 - latitude1);
    const deltaLongitude = this.degreesToRadians(longitude2 - longitude1);

    const a =
      Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLongitude / 2) *
        Math.sin(deltaLongitude / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
  }

  /**
   * Convertit des degrés en radians pour les calculs géométriques.
    *
    * @param degrees Angle exprimé en degrés.
    * @returns Le même angle exprimé en radians.
   */
  private degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
