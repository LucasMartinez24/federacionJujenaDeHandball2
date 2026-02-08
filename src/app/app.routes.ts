import { Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { ClubList } from './shared/components/club-list/club-list';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Federación de Handball - Login',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./shared/components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Panel de Gestión - Federación',
  },
  {
    path: 'jugador-form',
    loadComponent: () =>
      import('./shared/components/jugador-form/jugador-form.component').then(
        (m) => m.JugadorFormComponent,
      ),
    canActivate: [authGuard],
    title: 'Formulario de Jugador - Federación',
  },
  {
    path: 'clubes',
    component: ClubList,
    canActivate: [adminGuard],
    title: 'Clubes - Federación',
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
