import { Component } from '@angular/core';

import { GpsService } from './services/gps.service';
import { MotionService } from './services/motion.service';
import { TripService } from './services/trip.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {

  showAdvancedMetrics = false;


  constructor(
    private gps: GpsService,
    private motion: MotionService,
    private trip: TripService
  ) {

    this.gps.position$.subscribe(position => {

      if (position) {

        console.log(
          'Vitesse :',
          position.coords.speed,
          'm/s'
        );

        console.log(
          'Position :',
          position.coords.latitude,
          position.coords.longitude
        );
      }

    });


    this.motion.acceleration$.subscribe(acceleration => {

      console.log(
        'Accélération :',
        acceleration
      );

    });


    this.motion.orientation$.subscribe(orientation => {

      console.log(
        'Orientation :',
        orientation
      );

    });

  }


  async startTrip(): Promise<void> {

    await this.trip.start();

  }


  toggleAdvancedMetrics(): void {

    this.showAdvancedMetrics =
      !this.showAdvancedMetrics;

  }

}