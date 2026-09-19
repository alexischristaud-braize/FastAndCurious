import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../../services/database.service';
import { EtatLoading } from '../../../models/loading';

@Component({
  selector: 'app-trip-list',
  templateUrl: './trip-list.component.html',
  styleUrl: './trip-list.component.css',
})
export class TripListComponent implements OnInit {
  public trips: any[] = [];
  public tripLoading: EtatLoading = EtatLoading.WAITING;

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

  async ngOnInit(): Promise<void> {
    try {
      this.trips = await this.databaseService.getTrips();
      this.tripLoading = EtatLoading.SUCCESS;
    } catch {
      this.tripLoading = EtatLoading.ERROR;
      const now = Date.now();

      this.trips = [
        {
          id: 1,
          startedAt: now - 3 * 24 * 60 * 60 * 1000,
          endedAt: now - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000,
          elapsedTime: 32 * 600000,
          distance: 24.8,
          maxSpeed: 118.4,
          averageSpeed: 46.5,
          parameterId: 1,
        },
        {
          id: 2,
          startedAt: now - 24 * 60 * 60 * 1000,
          endedAt: now - 24 * 60 * 60 * 1000 + 18 * 60 * 1000,
          elapsedTime: 18 * 60000,
          distance: 12.3,
          maxSpeed: 96.7,
          averageSpeed: 41,
          parameterId: 1,
        },
        {
          id: 3,
          startedAt: now - 45 * 60 * 1000,
          endedAt: null,
          elapsedTime: 45 * 60000,
          distance: 31.6,
          maxSpeed: 132.1,
          averageSpeed: 52.8,
          parameterId: null,
        },
        {
          id: 1,
          startedAt: now - 3 * 24 * 60 * 60 * 1000,
          endedAt: now - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000,
          elapsedTime: 32 * 600000,
          distance: 24.8,
          maxSpeed: 118.4,
          averageSpeed: 46.5,
          parameterId: 1,
        },
        {
          id: 2,
          startedAt: now - 24 * 60 * 60 * 1000,
          endedAt: now - 24 * 60 * 60 * 1000 + 18 * 60 * 1000,
          elapsedTime: 18 * 60000,
          distance: 12.3,
          maxSpeed: 96.7,
          averageSpeed: 41,
          parameterId: 1,
        },
        {
          id: 3,
          startedAt: now - 45 * 60 * 1000,
          endedAt: null,
          elapsedTime: 45 * 60000,
          distance: 31.6,
          maxSpeed: 132.1,
          averageSpeed: 52.8,
          parameterId: null,
        },
        {
          id: 1,
          startedAt: now - 3 * 24 * 60 * 60 * 1000,
          endedAt: now - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000,
          elapsedTime: 32 * 600000,
          distance: 24.8,
          maxSpeed: 118.4,
          averageSpeed: 46.5,
          parameterId: 1,
        },
        {
          id: 2,
          startedAt: now - 24 * 60 * 60 * 1000,
          endedAt: now - 24 * 60 * 60 * 1000 + 18 * 60 * 1000,
          elapsedTime: 18 * 60000,
          distance: 12.3,
          maxSpeed: 96.7,
          averageSpeed: 41,
          parameterId: 1,
        },
        {
          id: 3,
          startedAt: now - 45 * 60 * 1000,
          endedAt: null,
          elapsedTime: 45 * 60000,
          distance: 31.6,
          maxSpeed: 132.1,
          averageSpeed: 52.8,
          parameterId: null,
        },
        {
          id: 1,
          startedAt: now - 3 * 24 * 60 * 60 * 1000,
          endedAt: now - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000,
          elapsedTime: 32 * 600000,
          distance: 24.8,
          maxSpeed: 118.4,
          averageSpeed: 46.5,
          parameterId: 1,
        },
        {
          id: 2,
          startedAt: now - 24 * 60 * 60 * 1000,
          endedAt: now - 24 * 60 * 60 * 1000 + 18 * 60 * 1000,
          elapsedTime: 18 * 60000,
          distance: 12.3,
          maxSpeed: 96.7,
          averageSpeed: 41,
          parameterId: 1,
        },
        {
          id: 3,
          startedAt: now - 45 * 60 * 1000,
          endedAt: null,
          elapsedTime: 45 * 60000,
          distance: 31.6,
          maxSpeed: 132.1,
          averageSpeed: 52.8,
          parameterId: null,
        },
        {
          id: 1,
          startedAt: now - 3 * 24 * 60 * 60 * 1000,
          endedAt: now - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000,
          elapsedTime: 32 * 600000,
          distance: 24.8,
          maxSpeed: 118.4,
          averageSpeed: 46.5,
          parameterId: 1,
        },
        {
          id: 2,
          startedAt: now - 24 * 60 * 60 * 1000,
          endedAt: now - 24 * 60 * 60 * 1000 + 18 * 60 * 1000,
          elapsedTime: 18 * 60000,
          distance: 12.3,
          maxSpeed: 96.7,
          averageSpeed: 41,
          parameterId: 1,
        },
        {
          id: 3,
          startedAt: now - 45 * 60 * 1000,
          endedAt: null,
          elapsedTime: 45 * 60000,
          distance: 31.6,
          maxSpeed: 132.1,
          averageSpeed: 52.8,
          parameterId: null,
        },
        {
          id: 1,
          startedAt: now - 3 * 24 * 60 * 60 * 1000,
          endedAt: now - 3 * 24 * 60 * 60 * 1000 + 32 * 60 * 1000,
          elapsedTime: 32 * 600000,
          distance: 24.8,
          maxSpeed: 118.4,
          averageSpeed: 46.5,
          parameterId: 1,
        },
        {
          id: 2,
          startedAt: now - 24 * 60 * 60 * 1000,
          endedAt: now - 24 * 60 * 60 * 1000 + 18 * 60 * 1000,
          elapsedTime: 18 * 60000,
          distance: 12.3,
          maxSpeed: 96.7,
          averageSpeed: 41,
          parameterId: 1,
        },
        {
          id: 3,
          startedAt: now - 45 * 60 * 1000,
          endedAt: null,
          elapsedTime: 45 * 60000,
          distance: 31.6,
          maxSpeed: 132.1,
          averageSpeed: 52.8,
          parameterId: null,
        },
      ];
    }

    this.trips.sort((firstTrip, secondTrip) => {
      if (firstTrip.endedAt === null) {
        return -1;
      }
      if (secondTrip.endedAt === null) {
        return 1;
      }
      return secondTrip.endedAt - firstTrip.endedAt;
    });

    this.tripLoading = EtatLoading.SUCCESS;
  }

  timeElapsed(endedAt: number): string {
    if (endedAt === null || endedAt === 0) {
      return 'En cours';
    }
    const timeNow = Date.now();
    const elapsedTime = timeNow - endedAt;
    const totalMinutes = Math.floor(elapsedTime / 60000);
    const totalHours = Math.floor(totalMinutes / 60);

    const day = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const minutes = totalMinutes % 60;

    return 'Il y a ' + (day > 0 ? `${day}j` : hours > 1 ? `${hours}h` : `${minutes}min`);
  }

  formatDuration(elapsedTime: number): string {
    const totalMinutes = Math.floor(elapsedTime / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h${minutes}min` : `${minutes}min`;
  }
}
