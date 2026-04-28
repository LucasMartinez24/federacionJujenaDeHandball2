import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private jugadoresService = inject(JugadoresService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  clubNombre: string = '';
  clubId: string | null = null;
  jugadores: Jugador[] = [];
  isLoading: boolean = false;
  searchText: string = '';

  private sub: Subscription = new Subscription();

  ngOnInit(): void {
    // 1. Suscripción al usuario para obtener el clubId del login
    this.sub.add(
      this.authService.currentUser$.subscribe((user: any) => {
        if (user) {
          this.clubNombre = user.nombre || user.username || 'Mi Club';
          this.clubId = (user.clubId ?? user.club?.id ?? user.id ?? null) as string | null;
          this.loadJugadores();
          this.cdr.detectChanges();
        }
      }),
    );

    // 2. Suscripción al stream de jugadores (Ya filtrados por el Backend)
    this.sub.add(
      this.jugadoresService.jugadores$.subscribe((data) => {
        // CONFIANZA TOTAL EN EL BACKEND:
        // El backend ya nos envía A, B y C agrupados por el nombre del club.
        this.jugadores = data;
        this.cdr.detectChanges();
      }),
    );
  }

  // --- LÓGICA DE FILTRADO PARA EL BUSCADOR ---
  get jugadoresFiltrados(): Jugador[] {
    if (!this.searchText) return this.jugadores;
    const term = this.searchText.toLowerCase().trim();
    return this.jugadores.filter(
      (j) => j.nombreCompleto.toLowerCase().includes(term) || j.dni.toString().includes(term),
    );
  }

  loadJugadores(): void {
    if (!this.clubId) return;
    this.isLoading = true;

    // Llamamos a la API: El backend resolverá los espejos automáticamente
    this.sub.add(
      this.jugadoresService.getJugadores(this.clubId).subscribe({
        next: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      }),
    );
  }

  // --- ACCIONES ---

  editarJugador(jugador: Jugador): void {
    this.router.navigate(['/jugador-form', jugador.id], {
      queryParams: { clubId: this.clubId, edit: 'true' },
    });
  }

  showDeleteModal: boolean = false;
  playerToDelete: { id: string; name: string } | null = null;

  confirmDelete(jugador: Jugador): void {
    this.playerToDelete = { id: jugador.id, name: jugador.nombreCompleto };
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showDeleteModal = false;
    this.playerToDelete = null;
    this.cdr.detectChanges();
  }

  executeDelete(): void {
    if (!this.playerToDelete) return;
    const playerName = this.playerToDelete.name;
    this.jugadoresService.deleteJugador(this.playerToDelete.id).subscribe({
      next: () => {
        this.closeModal();
        toast.warning('Jugador eliminado', {
          description: `Se ha borrado la ficha de ${playerName}`,
        });
      },
      error: () => toast.error('Error al eliminar'),
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
