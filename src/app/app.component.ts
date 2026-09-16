import { App, AppInfo } from '@capacitor/app';
import { Component, OnInit } from '@angular/core';

import { TripMetrics } from './models/trip-metrics';
import { TripService } from './services/trip.service';
import { DatabaseService } from './services/database.service';
import { LocalNotifications } from '@capacitor/local-notifications';
import { UpdateService } from './services/update.service';
import { Router, RouterLink } from '@angular/router';

/**
 * Composant racine de l'application.
 * Il centralise la consommation des métriques du trajet et
 * expose les actions de démarrage, d'arrêt et d'affichage avancé.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  // Contrôle l'affichage des métriques avancées dans le template.
  showAdvancedMetrics = false;
  count = 0;

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

  dataUpdated = false;
  // =========================
  // UPDATE
  // =========================
  updateAvailable = false;
  showUpdatePanel = false;
  isDownloading = false;

  updateTitle = 'Mise à jour disponible !';
  updateName = '';
  updateVersion = '';
  updateDescription = '';

  // Propriété publique : elle peut être transmise aux sous-composants via @Input.
  public infoApp: AppInfo | null = null;

  public router: Router;

  /**
   * Construit le composant racine et lance l'initialisation de la base SQLite.
   *
   * @param trip Service responsable du démarrage et de l'arrêt du trajet.
   * @param databaseService Service utilisé pour initialiser la base et lire les préférences.
   * @param db Référence au service utilisée pour enregistrer les préférences d'affichage.
   * @returns Rien. Le constructeur prépare uniquement l'état initial du composant.
   */
  constructor(
    private trip: TripService,
    private databaseService: DatabaseService,
    private db: DatabaseService,
    private updateService: UpdateService,
    private routerService: Router
  ) {
    this.router = routerService;

    this.databaseService
      .init()
      .then(() => {
        console.log('Base de données prête');
      })
      .catch((error) => {
        console.error("Erreur lors de l'initialisation SQLite :", error);
      });
  }

  /**
   * S'abonne aux mises à jour de métriques émises par le service de trajet.
   * Cela permet d'afficher en temps réel les informations du parcours.
   *
   * @returns Une Promise résolue après le chargement de la préférence d'affichage avancé.
   */
  async ngOnInit(): Promise<void> {
    this.trip.metrics$.subscribe((metrics) => {
      this.metrics = metrics;
    });
    this.showAdvancedMetrics = await this.databaseService.getPreference(
      'advancedMetrics'
    );

    this.infoApp = await App.getInfo();
    this.databaseService.updateConfig('apkVersion', this.infoApp.version);
    this.loadRelease();

    const permission = await LocalNotifications.requestPermissions();

    console.log(permission);
  }

  /**
   * Démarre le trajet courant.
   *
   * @returns Une Promise résolue lorsque les capteurs ont été démarrés.
   */
  async startTrip(): Promise<void> {
    await this.trip.start();
  }

  /**
   * Arrête le trajet courant.
   *
   * @returns Une Promise résolue lorsque les capteurs ont été arrêtés.
   */
  async stopTrip(): Promise<void> {
    await this.trip.stop();
  }

  /**
   * Bascule entre le démarrage et l'arrêt du trajet selon l'état actuel.
   *
   * @returns Rien. L'action appropriée est déclenchée en fonction de l'état courant.
   */
  toggleTrip(): void {
    if (this.metrics.isTracking) {
      this.stopTrip();
    } else {
      this.startTrip();
    }
  }

  /**
   * Active ou désactive l'affichage des métriques complémentaires.
   *
   * @returns Rien. Le nouvel état est mis à jour localement et enregistré dans SQLite.
   */
  toggleAdvancedMetrics(): void {
    this.showAdvancedMetrics = !this.showAdvancedMetrics;
    if (this.showAdvancedMetrics) {
      this.db.updatePreference('advancedMetrics', 1);
    } else {
      this.db.updatePreference('advancedMetrics', 0);
    }
  }

  async loadRelease(): Promise<void> {
    try {
      const release = await this.updateService.getLatestRelease();

      this.updateVersion = release.tag_name;
      this.updateName = release.name;

      this.updateDescription = release.body || 'Aucune description disponible.';
      if (this.infoApp?.version != release.tag_name) {
        this.updateAvailable = true;
      }
    } catch (error) {
      console.error(
        'Impossible de récupérer les informations de la release',
        error
      );

      this.updateAvailable = false;
    }
  }

  async openUpdatePanel(): Promise<void> {
    this.showUpdatePanel = true;
  }

  closeUpdatePanel(): void {
    this.showUpdatePanel = false;
  }

  async downloadUpdate(): Promise<void> {
    if (this.isDownloading) {
      return;
    }
    this.isDownloading = true;

    try {
      const result = await this.updateService.updateApp();

      if (result.success === false) {
        console.log("Installation annulée par l'utilisateur");
        return;
      }
    } catch (error) {
      console.error("Impossible d'installer la mise à jour", error);
    } finally {
      this.isDownloading = false;
    }
  }
}
