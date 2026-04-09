import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  // Inyectamos el servicio como PUBLIC para que el HTML lo reconozca
  public authService = inject(AuthService);
  private router = inject(Router);

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  // Helper para el badge de rol en el HTML
  getRoleLabel(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return '';

    const labels: Record<string, string> = {
      admin: 'Administrador',
      REP_FEDERACION: 'Rep. Federación',
      OFICIAL_MESA: 'Oficial de Mesa',
      JEFE_ARBITROS: 'Jefe de Árbitros',
      user: 'Club',
    };

    return labels[user.role] || 'Usuario';
  }

  // Mantenemos este por compatibilidad si lo usas en otros lados
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
