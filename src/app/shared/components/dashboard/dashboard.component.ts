import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necesario para el [(ngModel)] del buscador
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

  // Variable para el filtro de búsqueda
  searchText: string = '';

  private sub: Subscription = new Subscription();

  ngOnInit(): void {
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
        this.cdr.detectChanges();
      }),
    );
  }

  // --- LÓGICA DE FILTRADO ---
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

  // --- FUNCIONALIDADES ---

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

  // Cerrar modal
  closeModal(): void {
    this.showDeleteModal = false;
    this.playerToDelete = null;
    this.cdr.detectChanges();
  }

  // Ejecutar eliminación real
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

  // --- HELPERS ---
  private normalizeId(value: unknown): string {
    return String(value ?? '')
      .trim()
      .toLowerCase();
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

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
