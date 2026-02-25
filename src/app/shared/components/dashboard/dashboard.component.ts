import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  clubNombre: string = '';
  clubId: string | null = null;
  jugadores: Jugador[] = [];
  isLoading: boolean = false;

  private sub: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private jugadoresService: JugadoresService,
  ) {}

  private normalizeId(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
  }

  ngOnInit(): void {
    this.sub.add(
      this.authService.currentUser$.subscribe((user: any) => {
        if (user) {
          this.clubNombre = user.nombre || user.username || 'Mi Club';

          this.clubId = (user.clubId ?? user.club?.id ?? user.id ?? null) as string | null;

          this.loadJugadores();
        }
      }),
    );

    this.sub.add(
      this.jugadoresService.jugadores$.subscribe((data) => {
        if (!this.clubId) {
          this.jugadores = [];
          return;
        }

        const clubIdNorm = this.normalizeId(this.clubId);

        this.jugadores = data.filter((j: any) => {
          const jugadorClubId = j.clubId ?? j.club?.id ?? j.club_id;
          return this.normalizeId(jugadorClubId) === clubIdNorm;
        });
      }),
    );
  }

  loadJugadores(): void {
    this.isLoading = true;
    // Llamamos al servicio para que haga el GET al backend
    if (this.clubId) {
      this.sub.add(
        this.jugadoresService.getJugadores(this.clubId).subscribe({
          next: () => {
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            console.error('Error al traer jugadores del backend', err);
          },
        }),
      );
    } else {
      this.isLoading = false;
    }
  }

  // Se recomienda usar la categoría que ya viene calculada del backend
  // pero mantenemos esta por si el backend no la envía.
  getCategory(jugador: Jugador): string {
    if (jugador.categoria) return jugador.categoria;

    const nacimiento = new Date(jugador.fechaNacimiento);
    const edad = 2026 - nacimiento.getFullYear();

    if (edad >= 18) return 'Primera';
    if (edad >= 16) return 'Juvenil';
    if (edad >= 14) return 'Cadete';
    if (edad >= 12) return 'Menores';
    return 'Infantiles';
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

  deleteJugador(id: string): void {
    if (confirm('¿Está seguro de que desea eliminar este jugador?')) {
      this.jugadoresService.deleteJugador(id).subscribe({
        next: () => {
          // No hace falta filtrar a mano, el servicio ya actualiza el Subject
          console.log('Jugador eliminado con éxito');
        },
        error: (err) => alert('Error al eliminar el jugador'),
      });
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe(); // Limpieza de memoria
  }
}
