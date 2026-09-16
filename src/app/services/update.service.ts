import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { registerPlugin } from '@capacitor/core';

const ApkInstaller = registerPlugin<{
  download(options: { url: string }): Promise<{ uri: string }>;
  install(options: { uri: string }): Promise<void>;
}>('ApkInstaller');

export interface GithubRelease {
  tag_name: string;
  name: string;
  body: string;
}

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private apkUrl =
    'https://github.com/alexischristaud-braize/FastAndCurious/releases/latest/download/app-release.apk';

  private releaseApiUrl =
    'https://api.github.com/repos/alexischristaud-braize/FastAndCurious/releases/latest';

  async getLatestRelease(): Promise<GithubRelease> {
    console.log("Recherche d'une release");
    const response = await fetch(this.releaseApiUrl);

    if (!response.ok) {
      console.log("Erreur lors de recherche d'une release");
      throw new Error('Impossible de récupérer la release GitHub');
    }

    return await response.json();
  }

  async downloadApk(): Promise<string> {
    const result = await ApkInstaller.download({
      url: this.apkUrl,
    });

    return result.uri;
  }

  async updateApp(): Promise<void> {
    const apkUri = await this.downloadApk();

    const result = await ApkInstaller.install({
      uri: apkUri,
    });
    console.log( "update service update app : " + result);
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };

      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
