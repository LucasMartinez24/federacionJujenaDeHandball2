import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importamos ChangeDetectorRef
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
  private cdr = inject(ChangeDetectorRef); // 2. Inyectamos el detector de cambios

  clubes: Club[] = [];
  selectedClub: Club | null = null;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    console.log('[ClubList] Intentando llamar al servicio...');
    this.isLoading = true;

    this.clubesService.getClubes().subscribe({
      next: (res) => {
        console.log('[ClubList] ¡Llegaron datos!', res);
        this.clubes = res || [];

        if (this.clubes.length > 0) {
          this.selectedClub = this.clubes[0];
        }

        this.isLoading = false;

        // 3. FUNCIONALIDAD DE CARGA RÁPIDA:
        // Forzamos a Angular a que detecte los cambios y actualice el HTML inmediatamente
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ClubList] Error en suscripción:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => console.log('[ClubList] Petición finalizada'),
    });
  }

  selectClub(club: Club): void {
    this.selectedClub = club;
    // Forzamos la actualización visual al cambiar de club seleccionado
    this.cdr.detectChanges();
  }

  // --- FUNCIONALIDADES DE JUGADORES ---

  navegarCrearJugador(): void {
    if (this.selectedClub) {
      this.router.navigate(['/jugador-form'], {
        queryParams: { clubId: this.selectedClub.id },
      });
    }
  }

  // --- FUNCIONALIDAD: EDITAR JUGADOR ---
  // Envía el ID del jugador en la ruta y el clubId por queryParams
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
