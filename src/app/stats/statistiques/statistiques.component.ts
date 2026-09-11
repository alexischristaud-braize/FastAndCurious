import { Component, OnInit } from '@angular/core';
import { TripService } from '../../services/trip.service';
import { DatabaseService } from '../../services/database.service';
import { TripMetrics } from '../../models/trip-metrics';

@Component({
  selector: 'app-statistiques',
  templateUrl: './statistiques.component.html',
  styleUrl: './statistiques.component.css',
})
export class StatistiquesComponent implements OnInit {
  selectedPeriodLabel = 'au total';

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedPeriodLabel = select.options[select.selectedIndex].text;
  }

  // Contrôle l'affichage des métriques avancées dans le template.
  showAdvancedMetrics = false;
  dataUpdated = false;
  count = 0;

  trips: any[] = [];

  // État courant des données de trajet affichées dans l'interface.
  metrics: TripMetrics = {
    speed: 0,
    latitude: 0,
    longitude: 0,

    maxSpeed: 0,
    averageSpeed: 0,
    elapsedTime: 0,
    elapsedTimeRace: 0,
    time50: 0,
    time100: 0,
    bestTime50: 0,
    bestTime100: 0,

    gpsCount: 0,

    isTracking: false,

    distance: 0,
    accelerationX: 0,
    accelerationY: 0,
    accelerationZ: 0,

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

  /**
   * Construit le composant racine et lance l'initialisation de la base SQLite.
   *
   * @param trip Service responsable du démarrage et de l'arrêt du trajet.
   * @param databaseService Service utilisé pour initialiser la base et lire les préférences.
   * @param db Référence au service utilisée pour enregistrer les préférences d'affichage.
   * @returns Rien. Le constructeur prépare uniquement l'état initial du composant.
   */
  constructor(private databaseService: DatabaseService) {
    this.databaseService
      .init()
      .then(() => {
        console.log('Base de données prête');
      })
      .catch((error) => {
        console.error("Erreur lors de l'initialisation SQLite :", error);
      });
  }

  ngOnInit(): void {
    this.databaseService.getTrips().then((trips) => {
      this.trips = trips;
      this.calculateTripsStats();
    });
  }

  calculateTripsStats(): void {
    this.trips.forEach((trip) => {
      this.metrics.maxSpeed = (trip.maxSpeed > this.metrics.maxSpeed? trip.maxSpeed : this.metrics.maxSpeed);
      this.metrics.elapsedTime += trip.elapsedTime;
      this.metrics.distance += trip.distance;
      this.metrics.time50 = (trip.time50 > this.metrics.time50? trip.time50 : this.metrics.time50);
      this.metrics.time100 = (trip.time100 > this.metrics.time100? trip.time100 : this.metrics.time100);
    });
  }
}
