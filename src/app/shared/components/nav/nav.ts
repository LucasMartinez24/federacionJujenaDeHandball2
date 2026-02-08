import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
