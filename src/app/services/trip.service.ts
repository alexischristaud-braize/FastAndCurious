import { Injectable } from '@angular/core';

import { GpsService } from './gps.service';
import { MotionService } from './motion.service';

@Injectable({
  providedIn: 'root'
})
export class TripService {

  constructor(
    private gps: GpsService,
    private motion: MotionService
  ) {}

  async start(): Promise<void> {

    console.log('=== DÉBUT DU TRAJET ===');

    await this.gps.start();

    await this.motion.start();

  }
}