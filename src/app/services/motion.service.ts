import { Injectable } from '@angular/core';
import { Motion } from '@capacitor/motion';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MotionService {

  private accelerationSubject =
    new BehaviorSubject<any>(null);

  acceleration$ =
    this.accelerationSubject.asObservable();


  private orientationSubject =
    new BehaviorSubject<any>(null);

  orientation$ =
    this.orientationSubject.asObservable();


  async start(): Promise<void> {

    await Motion.addListener(
      'accel',
      event => {

        console.log('ACCELERATION :', event);

        this.accelerationSubject.next(
          event.accelerationIncludingGravity
        );
      }
    );


    await Motion.addListener(
      'orientation',
      event => {

        console.log('ORIENTATION :', event);

        this.orientationSubject.next(event);
      }
    );
  }
}