import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { StatistiquesComponent } from './stats/statistiques/statistiques.component';
import { TripListComponent } from './stats/trips/trip-list/trip-list.component';
import { TripItemComponent } from './stats/trips/trip-item/trip-item.component';
import { TripDetailsComponent } from './stats/trips/trip-details/trip-details.component';
import { SettingsComponent } from './settings/settings.component';

@NgModule({
  declarations: [AppComponent, DashboardComponent, StatistiquesComponent, TripListComponent, TripItemComponent, TripDetailsComponent, SettingsComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
