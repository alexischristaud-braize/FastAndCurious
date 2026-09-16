import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { TripMetrics } from '../models/trip-metrics';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private initPromise: Promise<void> | null = null;

  private readonly databaseName = 'fastandcurious';

  /**
   * Crée la connexion SQLite utilisée par le service.
   *
   * @returns Rien. La connexion est créée mais la base sera ouverte par {@link init}.
   */
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initialise la base de données.
   *
   * Si plusieurs méthodes demandent l'initialisation
   * en même temps, elles attendront toutes la même Promise.
   *
   * @returns Une Promise résolue lorsque la connexion et les tables sont prêtes.
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initialize();

    try {
      await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Effectue réellement l'initialisation de la base.
   *
   * @returns Une Promise résolue lorsque la base, ses tables et ses préférences sont prêtes.
   */
  private async initialize(): Promise<void> {
    console.log('[DB] Début initialisation');

    if (this.db) {
      console.log('[DB] Déjà initialisée');
      return;
    }

    try {
      console.log('[DB] Création de la connexion');

      this.db = await this.sqlite.createConnection(
        this.databaseName,
        false,
        'no-encryption',
        1,
        false
      );

      console.log('[DB] Connexion créée');

      await this.db.open();

      console.log('[DB] Base ouverte');

      await this.createTables();

      console.log('[DB] Tables créées');

      await this.db.run(`
        INSERT OR IGNORE INTO preferences (label, value)
        VALUES
          ('themeSombre', 0),
          ('advancedMetrics', 0)
      `);

       await this.db.run(`
        INSERT OR IGNORE INTO config (label, value)
        VALUES
          ('apkVersion', "0")
      `);
      console.log('[DB] Préférences initialisées');
      console.log('[DB] Initialisation terminée');
    } catch (error) {
      console.error('[DB] ERREUR :', error);
      throw error;
    }
  }

  /**
   * Création des tables.
   *
   * @returns Une Promise résolue lorsque toutes les tables existent.
   */
  private async createTables(): Promise<void> {
    // await this.db.execute('DROP TABLE IF EXISTS trip_data');
    // await this.db.execute('DROP TABLE IF EXISTS trip_motion');
    // await this.db.execute('DROP TABLE IF EXISTS trips');

    const query = `
      CREATE TABLE IF NOT EXISTS config (
        label VARCHAR(50) PRIMARY KEY,
        value VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS preferences (
        label VARCHAR(50) PRIMARY KEY,
        value INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS parameters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(50),
        defaultOrientationAlpha REAL DEFAULT 0,
        defaultOrientationBeta REAL DEFAULT 0,
        defaultOrientationGamma REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        elapsedTime INTEGER DEFAULT 0,
        distance REAL DEFAULT 0,
        maxSpeed REAL DEFAULT 0,
        averageSpeed REAL DEFAULT 0,
        parameterId INTEGER DEFAULT NULL,

        FOREIGN KEY (parameterId)
          REFERENCES parameters(id)
          ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS trip_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tripId INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        speed REAL DEFAULT 0,
        latitude REAL,
        longitude REAL,

        FOREIGN KEY (tripId)
          REFERENCES trips(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS trip_motion (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tripId INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        accelerationX REAL DEFAULT 0,
        accelerationY REAL DEFAULT 0,
        accelerationZ REAL DEFAULT 0,
        orientationAlpha REAL DEFAULT 0,
        orientationBeta REAL DEFAULT 0,
        orientationGamma REAL DEFAULT 0,

        FOREIGN KEY (tripId)
          REFERENCES trips(id)
          ON DELETE CASCADE
      );

      

    `;

    await this.db.execute(query);

    const columns = await this.db.query(`PRAGMA table_info(trips)`);
    const existingColumns = new Set(
      (columns.values ?? []).map((column: any) => column.name)
    );

    if (!existingColumns.has('time50')) {
      await this.db.execute(
        'ALTER TABLE trips ADD COLUMN time50 INTEGER DEFAULT 0'
      );
    }

    if (!existingColumns.has('time100')) {
      await this.db.execute(
        'ALTER TABLE trips ADD COLUMN time100 INTEGER DEFAULT 0'
      );
    }
  }

  /**
   * Crée un nouveau trajet.
   *
   * @param startedAt Horodatage Unix en millisecondes du début du trajet.
   * @returns L'identifiant numérique du trajet créé.
   */
  async createTrip(startedAt: number): Promise<number> {
    await this.init();

    const result = await this.db.run(
      `
        INSERT INTO trips (startedAt)
        VALUES (?)
      `,
      [startedAt]
    );

    if (result.changes?.lastId === undefined) {
      throw new Error('Impossible de créer le trajet');
    }

    return result.changes.lastId;
  }

  /**
   * Ajoute une mesure à un trajet.
   *
   * @param tripId Identifiant du trajet auquel rattacher la mesure.
   * @param metrics Mesures GPS et vitesse à enregistrer.
   * @returns L'identifiant numérique de la mesure créée.
   */
  async addTripData(tripId: number, metrics: TripMetrics): Promise<number> {
    await this.init();

    const result = await this.db.run(
      `
        INSERT INTO trip_data (
          tripId,
          timestamp,
          speed,
          latitude,
          longitude
        )
        VALUES (?, ?, ?, ?, ?)
      `,
      [tripId, Date.now(), metrics.speed, metrics.latitude, metrics.longitude]
    );

    if (result.changes?.lastId === undefined) {
      throw new Error("Impossible d'ajouter les données du trajet");
    }

    return result.changes.lastId;
  }

  /**
   * Met à jour un trajet terminé.
   *
   * @param tripId Identifiant du trajet à mettre à jour.
   * @param elapsedTime Durée du trajet écoulée, en millisecondes.
   * @param distance Distance parcourue, en mètres.
   * @param maxSpeed Vitesse maximale enregistrée.
   * @param averageSpeed Vitesse moyenne enregistrée.
   * @param time50 Temps jusqu'à 50 km/h, en millisecondes.
   * @param time100 Temps jusqu'à 100 km/h, en millisecondes.
   * @param endedAt Horodatage Unix en millisecondes de la fin du trajet.
   * @returns Une Promise résolue lorsque la mise à jour est enregistrée.
   */
  async updateTrip(
    tripId: number,
    elapsedTime: number,
    distance: number,
    maxSpeed: number,
    averageSpeed: number,
    time50: number,
    time100: number,
    endedAt: number
  ): Promise<void> {
    await this.init();

    await this.db.run(
      `
        UPDATE trips
        SET
          endedAt = ?,
          elapsedTime = ?,
          time50 = ?,
          time100 = ?,
          distance = ?,
          maxSpeed = ?,
          averageSpeed = ?
        WHERE id = ?
      `,
      [
        endedAt,
        elapsedTime,
        time50,
        time100,
        distance,
        maxSpeed,
        averageSpeed,
        tripId,
      ]
    );
  }

  /**
   * Récupère tous les trajets.
   *
   * @returns Une liste de trajets triés du plus récent au plus ancien.
   */
  async getTrips(): Promise<any[]> {
    await this.init();

    const result = await this.db.query(`
      SELECT *
      FROM trips
      ORDER BY startedAt DESC
    `);

    return result.values ?? [];
  }

  /**
   * Récupère un trajet.
   *
   * @param tripId Identifiant du trajet recherché.
   * @returns Le trajet trouvé, ou `null` si aucun trajet ne correspond à l'identifiant.
   */
  async getTrip(tripId: number): Promise<any | null> {
    await this.init();

    const result = await this.db.query(
      `
        SELECT *
        FROM trips
        WHERE id = ?
      `,
      [tripId]
    );

    return result.values && result.values.length > 0 ? result.values[0] : null;
  }

  /**
   * Récupère toutes les données d'un trajet.
   *
   * @param tripId Identifiant du trajet dont les mesures sont demandées.
   * @returns Les mesures du trajet dans l'ordre chronologique.
   */
  async getTripData(tripId: number): Promise<TripMetrics[]> {
    await this.init();

    const result = await this.db.query(
      `
        SELECT
          speed,
          latitude,
          longitude
        FROM trip_data
        WHERE tripId = ?
        ORDER BY timestamp ASC
      `,
      [tripId]
    );

    return result.values as TripMetrics[];
  }

  /**
   * Supprime un trajet.
   *
   * @param tripId Identifiant du trajet à supprimer.
   * @returns Une Promise résolue lorsque le trajet et ses données associées sont supprimés.
   */
  async deleteTrip(tripId: number): Promise<void> {
    await this.init();

    await this.db.run(
      `
        DELETE FROM trips
        WHERE id = ?
      `,
      [tripId]
    );
  }

  /**
   * Récupère une préférence.
   *
   * @param label Nom de la préférence à lire.
   * @returns `true` si la valeur stockée vaut 1, sinon `false`.
   */
  async getPreference(label: string): Promise<boolean> {
    await this.init();
    const result = await this.db.query(
      `
        SELECT value
        FROM preferences
        WHERE label = ?
      `,
      [label]
    );
    return result.values?.[0]?.value === 1;
  }

  /**
   * Modifie une préférence.
   *
   * @param label Nom de la préférence à modifier.
   * @param value Valeur numérique à enregistrer, généralement 0 ou 1.
   * @returns Une Promise résolue lorsque la préférence est enregistrée.
   */
  async updatePreference(label: string, value: number): Promise<void> {
    await this.init();

    await this.db.run(
      `
        UPDATE preferences
        SET value = ?
        WHERE label = ?
      `,
      [value, label]
    );
  }

  /**
   * Récupère une config.
   *
   * @param label Nom de la config à lire.
   * @returns la valeur stockée qui est un varchar .
   */
  async getConfig(label: string): Promise<string> {
    await this.init();
    const result = await this.db.query(
      `
        SELECT value
        FROM config
        WHERE label = ?
      `,
      [label]
    );

    return result.values?.[0]?.value;
  }

  /**
   * Modifie une config.
   *
   * @param label Nom de la config à modifier.
   * @param value Valeur varchar à enregistrer.
   * @returns Une Promise résolue lorsque la préférence est enregistrée.
   */
  async updateConfig(label: string, value: string): Promise<void> {
    await this.init();

    await this.db.run(
      `
        UPDATE config
        SET value = ?
        WHERE label = ?
      `,
      [value, label]
    );
  }

  /**
   * Ferme la base de données.
   *
   * @returns Une Promise résolue après la fermeture et la remise à zéro de la connexion.
   */
  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    await this.db.close();

    this.db = undefined as any;
    this.initPromise = null;
  }
}
