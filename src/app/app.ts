import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Nav } from './shared/components/nav/nav';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  showNav = true;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Oculta el nav si la ruta es /login
        this.showNav = !(event.urlAfterRedirects === '/login' || event.url === '/login');
      }
    });
  }
}
