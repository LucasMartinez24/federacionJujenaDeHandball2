import { Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { ClubList } from './shared/components/club-list/club-list';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { JugadorFormComponent } from './shared/components/jugador-form/jugador-form.component';

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
  { path: 'jugador-form/:id', component: JugadorFormComponent, canActivate: [authGuard] },
  {
    path: 'clubes',
    component: ClubList,
    canActivate: [adminGuard],
    title: 'Clubes - Federación',
  },
  {
    path: 'club-create',
    loadComponent: () =>
      import('./shared/components/club-create/club-create').then((m) => m.ClubCreate),
    canActivate: [adminGuard],
    title: 'Crear Club - Federación',
  },
  {
    path: 'torneos',
    loadComponent: () => import('./shared/components/torneos/torneos').then((m) => m.Torneos),
    canActivate: [adminGuard],
    title: 'Torneos - Federación',
  },
  {
    path: 'torneo-create',
    loadComponent: () =>
      import('./shared/components/torneos-form/torneos-form').then((m) => m.TorneosForm),
    canActivate: [adminGuard],
    title: 'Crear Torneo - Federación',
  },
  {
    path: 'fixture-generator/:id',
    loadComponent: () =>
      import('./shared/components/fixture-generator/fixture-generator').then(
        (m) => m.FixtureGenerator,
      ),
    canActivate: [adminGuard],
    title: 'Generador de Fixture - Federación',
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
