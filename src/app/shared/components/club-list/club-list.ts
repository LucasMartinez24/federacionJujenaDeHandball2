import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ClubesService, Club } from '../../../core/services/clubes.service';
import { Jugador } from '../../../core/services/jugadores.service';

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './club-list.html',
  styleUrl: './club-list.css',
})
export class ClubList implements OnInit {
  private clubesService = inject(ClubesService);
  private router = inject(Router);

  clubes: Club[] = [];
  selectedClub: Club | null = null;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    console.log('[ClubList] Intentando llamar al servicio...'); // TEST 1
    this.isLoading = true;

    this.clubesService.getClubes().subscribe({
      next: (res) => {
        console.log('[ClubList] ¡Llegaron datos!', res); // TEST 2
        this.clubes = res || [];
        if (this.clubes.length > 0) {
          this.selectedClub = this.clubes[0];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[ClubList] Error en suscripción:', err);
        this.isLoading = false;
      },
      complete: () => console.log('[ClubList] Petición finalizada'),
    });
  }

  selectClub(club: Club): void {
    this.selectedClub = club;
  }

  // --- FUNCIONALIDADES DE JUGADORES ---

  navegarCrearJugador(): void {
    if (this.selectedClub) {
      this.router.navigate(['/jugador-form'], {
        queryParams: { clubId: this.selectedClub.id },
      });
    }
  }

  editarJugador(jugador: Jugador): void {
    if (this.selectedClub) {
      this.router.navigate(['/jugador-form', jugador.id], {
        queryParams: {
          clubId: this.selectedClub.id,
          edit: 'true',
        },
      });
    }
  }

  // --- HELPERS ---

  getTotalAllJugadores(): number {
    return this.clubes.reduce((acc, club) => acc + (club.jugadores?.length || 0), 0);
  }

  getInitials(name: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  getTotalJugadores(club: Club): number {
    return club.jugadores ? club.jugadores.length : 0;
  }
}
