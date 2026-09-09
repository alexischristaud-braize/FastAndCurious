import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard/dashboard.component';
import { StatistiquesComponent } from './stats/statistiques/statistiques.component';

const routes: Routes = [
   { path: '', component: DashboardComponent },
   { path: 'dashboard', component: DashboardComponent },
   { path: 'statistiques', component: StatistiquesComponent },
   { path: 'historique', component: StatistiquesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
