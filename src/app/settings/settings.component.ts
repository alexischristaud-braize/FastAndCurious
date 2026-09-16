import { Component, Input, OnInit } from '@angular/core';
import { App, AppInfo } from '@capacitor/app';
import { Device, DeviceInfo } from '@capacitor/device';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  public infoDevice: DeviceInfo | null = null;
  public infoApp: AppInfo | null = null;

  async ngOnInit(): Promise<void> {
    this.infoDevice = await Device.getInfo();
    this.infoApp = await App.getInfo();
  
  }
}
