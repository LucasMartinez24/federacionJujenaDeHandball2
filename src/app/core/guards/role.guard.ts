// core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Array<UserRole>;
  const user = authService.getCurrentUser();

  // 1. Si no está autenticado, al login
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Si el rol del usuario está permitido, adelante
  if (user && allowedRoles.includes(user.role)) {
    return true;
  }

  // 3. Si no tiene permiso, redirigir según quién sea para que no se quede trabado
  if (user?.role === 'user') router.navigate(['/dashboard']);
  else if (user?.role === 'REP_FEDERACION') router.navigate(['/clubes']);
  else if (user?.role === 'OFICIAL_MESA') router.navigate(['/torneos']);
  else router.navigate(['/formGaleria']); // PARA CM

  return false;
};
