import { Component, signal, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Nav } from './shared/components/nav/nav';
import { CommonModule } from '@angular/common';
import { NgxSonnerToaster } from 'ngx-sonner';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, CommonModule, NgxSonnerToaster],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  showNav = true;
  private authService = inject(AuthService);

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const isGaleria = event.urlAfterRedirects === '/galeria' || event.url === '/galeria';
        const isLoginOrPrincipal =
          event.urlAfterRedirects === '/login' ||
          event.url === '/login' ||
          event.urlAfterRedirects === '/Principal' ||
          event.url === '/Principal';

        if (isLoginOrPrincipal) {
          this.showNav = false;
        } else if (isGaleria) {
          // Solo mostrar nav en galeria si es CM
          this.showNav = this.authService.isCM();
        } else {
          this.showNav = true;
        }
      }
    });
  }
}
