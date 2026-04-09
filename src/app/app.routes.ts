import { Routes } from '@angular/router';
import { LoginComponent } from './shared/components/login/login.component';
import { ClubList } from './shared/components/club-list/club-list';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'FJH - Login' },

  // --- DASHBOARD PRINCIPAL (Solo para Clubes) ---
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./shared/components/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'user'] },
    title: 'Panel Club - FJH',
  },

  // --- CLUBES Y AUDITORÍA (Admin y Representante) ---
  {
    path: 'clubes',
    component: ClubList,
    canActivate: [roleGuard],
    data: { roles: ['admin', 'REP_FEDERACION'] },
    title: 'Instituciones - FJH',
  },
  {
    path: 'club-create',
    loadComponent: () =>
      import('./shared/components/club-create/club-create').then((m) => m.ClubCreate),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }, // Solo Admin crea la institución
    title: 'Nuevo Club',
  },

  // --- JUGADORES (Solo Clubes y Admin) ---
  {
    path: 'jugador-form',
    loadComponent: () =>
      import('./shared/components/jugador-form/jugador-form.component').then(
        (m) => m.JugadorFormComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'user'] },
    title: 'Ficha Jugador',
  },
  {
    path: 'jugador-form/:id',
    loadComponent: () =>
      import('./shared/components/jugador-form/jugador-form.component').then(
        (m) => m.JugadorFormComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'user'] },
  },

  // --- TORNEOS Y FIXTURE (Admin, Planillero, Árbitro y Club) ---
  {
    path: 'torneos',
    loadComponent: () => import('./shared/components/torneos/torneos').then((m) => m.Torneos),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'OFICIAL_MESA', 'JEFE_ARBITROS', 'user'] }, // 'user' añadido para que el club vea torneos
    title: 'Torneos Oficiales',
  },
  {
    path: 'torneo-create',
    loadComponent: () =>
      import('./shared/components/torneos-form/torneos-form').then((m) => m.TorneosForm),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'OFICIAL_MESA'] },
    title: 'Nuevo Torneo',
  },
  {
    path: 'fixture-generator/:id',
    loadComponent: () =>
      import('./shared/components/fixture-generator/fixture-generator').then(
        (m) => m.FixtureGenerator,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'OFICIAL_MESA'] }, // Planillero puede generar fixture
    title: 'Generador Fixture',
  },
  {
    path: 'fixture-management/:id',
    loadComponent: () =>
      import('./shared/components/fixture-management/fixture-management').then(
        (m) => m.FixtureManagement,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin', 'OFICIAL_MESA', 'JEFE_ARBITROS', 'user'] }, // Todos ven el acta, pero el componente filtrará botones por rol
    title: 'Acta de Partido',
  },

  // --- SOPORTE ---
  {
    path: 'support',
    loadComponent: () =>
      import('./shared/components/support-admin-component/support-admin-component').then(
        (m) => m.SupportAdminComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['admin'] }, // El rep. también puede atender soporte
    title: 'Tickets Federación',
  },
  {
    path: 'support-club',
    loadComponent: () =>
      import('./shared/components/support-club-component/support-club-component').then(
        (m) => m.SupportClubComponent,
      ),
    canActivate: [roleGuard],
    data: { roles: ['user', 'REP_FEDERACION', 'OFICIAL_MESA', 'JEFE_ARBITROS'] },
    title: 'Soporte Club',
  },

  // --- CALENDARIO (Solo Clubes) ---
  {
    path: 'calendarioCompleto',
    loadComponent: () =>
      import('./shared/components/club-dashboard/club-dashboard').then((m) => m.ClubDashboard),
    canActivate: [roleGuard],
    data: { roles: ['user', 'admin'] },
    title: 'Mi Agenda',
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
