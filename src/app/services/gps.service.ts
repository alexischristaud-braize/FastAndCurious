import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GpsService {

  private positionSubject = new BehaviorSubject<Position | null>(null);

  position$ = this.positionSubject.asObservable();


  async start(): Promise<void> {

    const permission = await Geolocation.requestPermissions();

    console.log('Permission GPS :', permission);

    await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      },
      (position, error) => {

        if (error) {
          console.error('Erreur GPS :', error);
          return;
        }

        if (position) {
          console.log('GPS :', position);

          this.positionSubject.next(position);
        }
      }
    );
  }
}