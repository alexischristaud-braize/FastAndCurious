import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { StatistiquesComponent } from './stats/statistiques/statistiques.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    StatistiquesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

