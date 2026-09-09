export interface TripMetrics {

  // =========================
  // ÉTAT DU TRAJET
  // =========================

  isTracking: boolean;

  // =========================
  // DONNÉES GPS ACTUELLES
  // =========================

  speed: number;
  latitude: number;
  longitude: number;

  // =========================
  // STATISTIQUES VITESSE
  // =========================

  maxSpeed: number;
  averageSpeed: number;
  gpsCount: number;

  // =========================
  // TEMPS
  // =========================

  elapsedTime: number;

  // =========================
  // DISTANCE
  // =========================

  distance: number;

  // =========================
  // DONNÉES MOUVEMENT BRUTES
  // =========================

  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;

  orientationAlpha: number;
  orientationBeta: number;
  orientationGamma: number;

  // =========================
  // ACCÉLÉRATION DU VÉHICULE
  // =========================

  accelerationLongitudinal: number;
  accelerationLateral: number;
  accelerationVertical: number;

  // =========================
  // FORCE EN G
  // =========================

  gLongitudinal: number;
  gLateral: number;
  gVertical: number;

  // Force totale ressentie
  gTotal: number;
}