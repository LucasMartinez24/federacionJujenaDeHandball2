import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ClubesService, Club } from '../../../core/services/clubes.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';
import { environment } from '../../../../environments/environment';
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './club-list.html',
  styleUrl: './club-list.css',
})
export class ClubList implements OnInit {
  private clubesService = inject(ClubesService);
  private jugadoresService = inject(JugadoresService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  public authService = inject(AuthService);

  clubes: Club[] = [];
  selectedClub: Club | null = null;
  isLoading: boolean = false;
  competenciasActivas: number = 0;

  // Filtros
  searchText: string = '';
  statusFilter: string = 'Todos';

  // Modales
  showDocsModal = false;
  showDeleteModal = false;
  showDeleteModalClub = false;
  selectedPlayerDocs: any = null;
  playerToDelete: any = null;
  clubToDelete: any = null;

  ngOnInit(): void {
    this.loadClubs();
  }

  loadClubs(): void {
    this.isLoading = true;
    this.clubesService.getClubes().subscribe({
      next: (res) => {
        this.clubes = (res || []).map((c) => ({
          ...c,
          esInvitado: !!c.esInvitado,
        }));

        if (this.clubes.length > 0 && !this.selectedClub) {
          this.selectClub(this.clubes[0]);
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => (this.isLoading = false),
    });
  }

  selectClub(club: Club): void {
    this.selectedClub = club;
    this.calcularCompetenciasActivas(club.id);
    this.cdr.detectChanges();
  }

  editarJugador(jugador: Jugador): void {
    if (this.selectedClub) {
      this.router.navigate(['/jugador-form', jugador.id], {
        queryParams: { clubId: this.selectedClub.id, edit: 'true' },
      });
    }
  }

  private calcularCompetenciasActivas(clubId: string): void {
    this.clubesService.getAgendaClub(clubId).subscribe({
      next: (partidos) => {
        const torneosUnicos = new Set(partidos.map((p) => p.torneoId));
        this.competenciasActivas = torneosUnicos.size;
        this.cdr.detectChanges();
      },
      error: () => {
        this.competenciasActivas = 0;
        this.cdr.detectChanges();
      },
    });
  }

  // --- GETTERS FILTRADOS CON LÓGICA DE CATEGORÍA ---
  get jugadoresFiltrados(): any[] {
    if (!this.selectedClub?.jugadores) return [];
    return this.selectedClub.jugadores.filter((j) => {
      const matchesStatus =
        this.statusFilter === 'Todos' || (j.estado || 'Pendiente') === this.statusFilter;
      const term = this.searchText.toLowerCase().trim();
      const matchesText =
        !term || j.nombreCompleto.toLowerCase().includes(term) || j.dni.toString().includes(term);
      return matchesStatus && matchesText;
    });
  }

  // --- ESTADÍSTICAS GLOBALES ---
  getTotalAllJugadores(): number {
    return this.clubes.reduce((acc, club) => {
      return acc + (club.jugadores?.filter((j) => j.estado === 'Aprobado').length || 0);
    }, 0);
  }

  getTotalRegistrosPendientes(): number {
    return this.clubes.reduce((acc, club) => {
      return (
        acc + (club.jugadores?.filter((j) => j.estado === 'Pendiente' || !j.estado).length || 0)
      );
    }, 0);
  }

  // --- GESTIÓN DE JUGADORES ---
  cambiarEstado(jugador: Jugador, nuevoEstado: string): void {
    this.jugadoresService.cambiarEstado(jugador.id, nuevoEstado).subscribe({
      next: (jugadorActualizado) => {
        // Actualizamos la referencia local para que el HTML reaccione
        jugador.estado = jugadorActualizado.estado;
        toast.success(nuevoEstado === 'Aprobado' ? 'Habilitado' : 'Rechazado');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        toast.error('No se pudo actualizar en el servidor');
      },
    });
  }

  verDocumentacion(jugador: any) {
    this.selectedPlayerDocs = jugador;
    this.showDocsModal = true;
  }

  confirmDelete(jugador: Jugador) {
    this.playerToDelete = { id: jugador.id, name: jugador.nombreCompleto };
    this.showDeleteModal = true;
  }

  executeDelete() {
    if (!this.playerToDelete) return;
    this.jugadoresService.deleteJugador(this.playerToDelete.id).subscribe({
      next: () => {
        if (this.selectedClub) {
          this.selectedClub.jugadores = this.selectedClub.jugadores?.filter(
            (j) => j.id !== this.playerToDelete.id,
          );
        }
        this.showDeleteModal = false;
        toast.warning('Jugador eliminado');
        this.cdr.detectChanges();
      },
    });
  }

  // --- GESTIÓN DE CLUBES ---
  editarClub(club: Club): void {
    this.router.navigate(['/club-create'], { queryParams: { id: club.id, edit: 'true' } });
  }

  confirmDeleteClub(club: any) {
    this.clubToDelete = club;
    this.showDeleteModalClub = true;
  }

  executeDeleteClub() {
    this.clubesService.deleteClub(this.clubToDelete.id).subscribe({
      next: () => {
        toast.success('Club eliminado');
        this.showDeleteModalClub = false;
        this.selectedClub = null;
        this.loadClubs();
      },
    });
  }

  navegarCrearJugador(): void {
    if (this.authService.isRepFederacion()) {
      toast.error('Los representantes solo pueden auditar fichas existentes');
      return;
    }
    if (this.selectedClub && !this.selectedClub.esInvitado) {
      this.router.navigate(['/jugador-form'], {
        queryParams: { clubId: this.selectedClub.id },
      });
    } else {
      toast.error('Acción no permitida');
    }
  }

  async exportarPlantilla() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla FJH');
    worksheet.addRow(['FEDERACIÓN JUJEÑA DE HANDBALL']).font = { bold: true, size: 14 };
    worksheet.addRow([`PLANTILLA: ${this.selectedClub?.nombre.toUpperCase()}`]);
    worksheet.addRow(['Jugador', 'DNI', 'Categoría', 'Estado']);

    this.jugadoresFiltrados.forEach((j) => {
      const cat = j.categoriaEspecial || j.categoria;
      worksheet.addRow([j.nombreCompleto, j.dni, cat, j.estado || 'Pendiente']);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Plantilla_${this.selectedClub?.siglas}.xlsx`);
  }

  closeModal() {
    this.showDeleteModal = false;
  }
}
