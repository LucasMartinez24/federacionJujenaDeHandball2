import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  clubNombre: string = '';
  clubId: number | undefined;
  jugadores: Jugador[] = [];

  constructor(
    private authService: AuthService,
    private jugadoresService: JugadoresService,
  ) {}

  ngOnInit(): void {
    this.clubNombre = this.authService.getClubNombre() || 'Mi Club';
    this.clubId = this.authService.getClubId();
    this.loadJugadores();
  }

  loadJugadores(): void {
    if (this.clubId) {
      this.jugadores = this.jugadoresService.getJugadoresByClub(this.clubId);
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  deleteJugador(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este jugador?')) {
      this.jugadoresService.deleteJugador(id);
      this.loadJugadores();
    }
  }
}
