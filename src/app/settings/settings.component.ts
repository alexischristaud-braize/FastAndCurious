import { Component, input, Input, OnInit } from '@angular/core';
import { App, AppInfo } from '@capacitor/app';
import { Device, DeviceInfo } from '@capacitor/device';
import { DatabaseService } from '../services/database.service';
import { UpdateService } from '../services/update.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  public infoDevice: DeviceInfo | null = null;
  public infoApp: AppInfo | null = null;
  public showUpdate: boolean = true;
  public themeSombre: boolean = true;
  public test1: boolean = true;
  public test2: boolean = true;

  public showUpdatePanelActual: boolean = false;
  public showUpdatePanelLatest: boolean = false;

  actualTitle: string = '';
  actualVersion: string = '';
  actualDescription: string = '';

  latestTitle: string = '';
  latestVersion: string = '';
  latestDescription: string = '';

  /**
   * Construit le composant racine et lance l'initialisation de la base SQLite.
   *
   * @param trip Service responsable du démarrage et de l'arrêt du trajet.
   * @param databaseService Service utilisé pour initialiser la base et lire les préférences.
   * @param db Référence au service utilisée pour enregistrer les préférences d'affichage.
   * @returns Rien. Le constructeur prépare uniquement l'état initial du composant.
   */
  constructor(private databaseService: DatabaseService, private updateService: UpdateService) {
    this.databaseService
      .init()
      .then(() => {
        console.log('Base de données prête');
      })
      .catch((error) => {
        console.error("Erreur lors de l'initialisation SQLite :", error);
      });
  }

  async ngOnInit(): Promise<void> {
    this.infoDevice = await Device.getInfo();
    this.infoApp = await App.getInfo();

    this.actualTitle = await this.databaseService.getConfig('apkTitle');
    this.actualVersion = await this.databaseService.getConfig('apkVersion');
    this.actualDescription = await this.databaseService.getConfig('apkDescription');

    this.showUpdate = await this.databaseService.getPreference('showUpdate');
    this.themeSombre = await this.databaseService.getPreference('themeSombre');

    const latestRelease = await this.updateService.getLatestRelease();
    this.latestTitle = latestRelease.name;
    this.latestVersion = latestRelease.tag_name;
    this.latestDescription = latestRelease.body;
  }

  public getconvertToOctet(): string {
    if (this.infoDevice?.memUsed) {
      let result = this.infoDevice.memUsed; // Bytes
      if (result >= 1024) {
        result = result / 1024; // Kilo
        if (result >= 1024) {
          result = result / 1024; // Mega
          if (result >= 1024) {
            result = result / 1024; // Giga
            return result.toFixed(2) + 'GBs';
          }
          return result.toFixed(2) + 'MBs';
        }
        return result.toFixed(2) + 'KBs';
      }
      return result.toFixed(2) + 'Bs';
    }
    return 'no data';
  }

  public async switchVariable<T extends keyof SettingsComponent>(switchVariable: T): Promise<void> {
    const value = this[switchVariable];

    if (typeof value === 'boolean') {
      const newValue = !value;
      (this as Record<T, boolean>)[switchVariable] = newValue;
      await this.databaseService.updatePreference(String(switchVariable), newValue ? 1 : 0);
    }
  }

  /**
   * ouvre le panneau de details de mise a jour
   * @param actual il s'agit du panneau de version actuel
   */
  async openUpdatePanel(actual: boolean): Promise<void> {
    actual ? (this.showUpdatePanelActual = true) : (this.showUpdatePanelLatest = true);
  }

  /**
   * ferme le panneau de details de mise a jour
   * @param actual il s'agit du panneau de version actuel
   */
  closeUpdatePanel(actual: boolean): void {
    actual ? (this.showUpdatePanelActual = false) : (this.showUpdatePanelLatest = false);
  }
}
