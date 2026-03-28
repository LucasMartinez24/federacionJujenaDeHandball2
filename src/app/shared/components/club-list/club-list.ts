import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ClubesService, Club } from '../../../core/services/clubes.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service'; // Inyectamos el servicio
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-club-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './club-list.html',
  styleUrl: './club-list.css',
})
export class ClubList implements OnInit {
  private clubesService = inject(ClubesService);
  private jugadoresService = inject(JugadoresService); // Inyectamos para gestionar estados
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  clubes: Club[] = [];
  selectedClub: Club | null = null;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadClubs();
  }
  editarClub(club: Club): void {
    this.router.navigate(['/club-create'], {
      queryParams: { id: club.id, edit: 'true' },
    });
  }

  loadClubs(): void {
    this.isLoading = true;
    this.clubesService.getClubes().subscribe({
      next: (res) => {
        this.clubes = res || [];
        if (this.clubes.length > 0 && !this.selectedClub) {
          this.selectedClub = this.clubes[0];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar clubes:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectClub(club: Club): void {
    this.selectedClub = club;
    this.cdr.detectChanges();
  }

  // --- NUEVA LÓGICA: CAMBIAR ESTADO (APROBAR/RECHAZAR) ---
  cambiarEstado(jugador: Jugador, nuevoEstado: string): void {
    // Creamos el FormData para el backend (nuestro PUT recibe multipart/form-data)
    const formData = new FormData();
    formData.append('estado', nuevoEstado);

    this.jugadoresService.updateJugador(jugador.id, formData as any).subscribe({
      next: () => {
        // Actualizamos localmente el estado para reflejar el cambio en la tabla
        jugador.estado = nuevoEstado;

        const config =
          nuevoEstado === 'Aprobado'
            ? { msg: 'Jugador Habilitado', icon: 'check_circle' }
            : { msg: 'Ficha Rechazada', icon: 'block' };

        toast.success(config.msg, {
          description: `${jugador.nombreCompleto} ha sido actualizado.`,
        });

        this.cdr.detectChanges();
      },
      error: () => toast.error('No se pudo cambiar el estado del jugador'),
    });
  }

  // --- NUEVA LÓGICA: ELIMINAR JUGADOR ---
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

    const id = this.playerToDelete.id;
    const nombre = this.playerToDelete.name;

    this.jugadoresService.deleteJugador(id).subscribe({
      next: () => {
        // 1. Filtramos la lista del club seleccionado localmente
        if (this.selectedClub && this.selectedClub.jugadores) {
          this.selectedClub.jugadores = this.selectedClub.jugadores.filter((j) => j.id !== id);
        }

        // 2. Cerramos el modal y notificamos
        this.closeModal();
        toast.warning('Jugador eliminado', {
          description: `Se ha borrado la ficha de ${nombre} y sus documentos.`,
        });

        this.cdr.detectChanges();
      },
      error: () => {
        toast.error('Error al eliminar', {
          description: 'No se pudo completar la acción en el servidor.',
        });
      },
    });
  }
  // --- ESTADÍSTICAS DINÁMICAS ---

  getTotalRegistrosPendientes(): number {
    return this.clubes.reduce((acc, club) => {
      const pendientes =
        club.jugadores?.filter((j) => j.estado === 'Pendiente' || !j.estado).length || 0;
      return acc + pendientes;
    }, 0);
  }
  searchText: string = '';
  statusFilter: string = 'Todos';

  // Getter dinámico para filtrar la lista
  get jugadoresFiltrados(): Jugador[] {
    if (!this.selectedClub || !this.selectedClub.jugadores) return [];

    return this.selectedClub.jugadores.filter((j) => {
      // 1. Filtro por Estado
      const matchesStatus =
        this.statusFilter === 'Todos' || (j.estado || 'Pendiente') === this.statusFilter;

      // 2. Filtro por Texto (Nombre o DNI)
      const term = this.searchText.toLowerCase().trim();
      const matchesText =
        !term || j.nombreCompleto.toLowerCase().includes(term) || j.dni.toString().includes(term);

      return matchesStatus && matchesText;
    });
  }
  getTotalAllJugadores(): number {
    return this.clubes.reduce((acc, club) => {
      const aprobados = club.jugadores?.filter((j) => j.estado === 'Aprobado').length || 0;
      return acc + aprobados;
    }, 0);
  }

  // --- NAVEGACIÓN Y HELPERS ---

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
        queryParams: { clubId: this.selectedClub.id, edit: 'true' },
      });
    }
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

  //eliminar club
  showDeleteModalClub = false;
  clubToDelete: any = null;

  // Abrir modal
  confirmDeleteClub(club: any) {
    this.clubToDelete = club;
    this.showDeleteModalClub = true;
  }

  // Ejecutar eliminación
  executeDeleteClub() {
    if (!this.clubToDelete) return;

    this.clubesService.deleteClub(this.clubToDelete.id).subscribe({
      next: () => {
        toast.success('Club eliminado', {
          description: `El club ${this.clubToDelete.nombre} ha sido removido.`,
        });
        this.showDeleteModalClub = false;
        this.loadClubs(); // Recargar la lista
        this.selectedClub = null; // Limpiar selección
      },
      error: (err) => {
        toast.error('Error al eliminar', {
          description: err.error?.error || 'No se pudo completar la acción.',
        });
        this.showDeleteModalClub = false;
      },
    });
  }
  //exportar plantilla
  async exportarPlantilla() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla FJH');

    // 1. TÍTULO PRINCIPAL
    const titleRow = worksheet.addRow(['FEDERACIÓN JUJEÑA DE HANDBALL']);
    worksheet.mergeCells('A1:H1');
    titleRow.font = { name: 'Arial', family: 4, size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1D4ED8' }, // Azul Primario FJH
    };

    // 2. SUBTÍTULO
    const subTitleRow = worksheet.addRow([
      `PLANTILLA OFICIAL: ${this.selectedClub?.nombre.toUpperCase()}`,
    ]);
    worksheet.mergeCells('A2:H2');
    subTitleRow.font = { size: 12, bold: true };
    subTitleRow.alignment = { horizontal: 'center' };

    // 3. CABECERA DE TABLA
    const headerRow = worksheet.addRow([
      'Institución',
      'Jugador',
      'DNI',
      'Categoría',
      'Género',
      'Estado',
      'Nacionalidad',
      'WhatsApp',
    ]);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      cell.font = { bold: true, color: { argb: 'FF334155' } };
      cell.border = { bottom: { style: 'thin' } };
    });

    // 4. DATOS
    this.jugadoresFiltrados.forEach((j) => {
      const row = worksheet.addRow([
        this.selectedClub?.nombre,
        j.nombreCompleto,
        j.dni,
        j.categoria,
        j.genero,
        j.estado || 'Pendiente',
        j.nacionalidad,
        j.whatsapp || 'N/A',
      ]);

      // Color condicional para el estado
      const statusCell = row.getCell(6);
      if (j.estado === 'Aprobado') statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
      if (j.estado === 'Pendiente') statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      if (j.estado === 'Rechazado') statusCell.font = { color: { argb: 'FFEF4444' }, bold: true };
    });

    // 5. AJUSTES FINALES (Ancho de columnas)
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    // 6. DESCARGA
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `FJH_Plantilla_${this.selectedClub?.siglas}.xlsx`);
  }
  showDocsModal = false;
  selectedPlayerDocs: any = null;

  verDocumentacion(jugador: any) {
    this.selectedPlayerDocs = jugador;
    this.showDocsModal = true;
  }
}
