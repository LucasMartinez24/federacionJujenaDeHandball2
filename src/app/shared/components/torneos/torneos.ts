import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TorneosService } from '../../../core/services/torneos.service';
import { toast } from 'ngx-sonner';
import { AuthService } from '../../../core/services/auth.service';
interface Torneo {
  id: string;
  nombre: string;
  categoria: string;
  tipo: string; // 'Liga', 'Copa', etc.
  estado: 'In Progress' | 'Upcoming' | 'Archive';
  equiposCount: number;
  progreso: number;
  colorClase: string;
  fechaInicio: string;
}
@Component({
  selector: 'app-torneos',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './torneos.html',
  styleUrl: './torneos.css',
})
export class Torneos implements OnInit {
  private torneosService = inject(TorneosService);
  private router = inject(Router);
  private authService = inject(AuthService);
  torneos: any[] = [];
  filtroActual: string = 'Active';
  searchText: string = '';
  loading = false;

  esAdmin: boolean = false;

  ngOnInit() {
    this.esAdmin = this.authService.isAdmin();
    const user = this.authService.getId();

    if (this.esAdmin) {
      this.cargarTorneos();
    } else if (user) {
      this.cargarTorneosPorClub(user);
    } else {
      toast.error('Error de sesión: No se identificó el club.');
    }
  }

  cargarTorneosPorClub(clubId: string) {
    this.loading = true;
    this.torneosService.getTorneosPorClub(clubId).subscribe({
      next: (data) => {
        this.torneos = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        toast.error('No se pudieron cargar tus torneos.');
      },
    });
  }

  private cdr = inject(ChangeDetectorRef); // 2. Inyecta esto

  cargarTorneos() {
    this.loading = true;
    this.torneosService.getTorneos().subscribe({
      next: (data) => {
        this.torneos = data;
        this.loading = false;
        this.cdr.detectChanges(); // 3. FUERZA LA DETECCIÓN AQUÍ
      },
      error: () => {
        this.loading = false;
      },
    });
  }
  setFiltro(filtro: string) {
    this.filtroActual = filtro;
  }

  // Lógica de filtrado para el *ngFor
  get torneosMostrados() {
    return this.torneos.filter((t) => {
      const matchFiltro =
        this.filtroActual === 'Active'
          ? t.estado === 'In Progress'
          : this.filtroActual === 'Upcoming'
            ? t.estado === 'Upcoming'
            : t.estado === 'Archive';

      const matchSearch =
        t.nombre.toLowerCase().includes(this.searchText.toLowerCase()) ||
        t.categoria.toLowerCase().includes(this.searchText.toLowerCase());

      return matchFiltro && matchSearch;
    });
  }

  crearTorneo() {
    toast.info('Abriendo panel de configuración de torneo...');
    this.router.navigate(['/torneo-create']);
  }
  getEquiposCount(torneo: any): number {
    console.log('Calculando equipos para torneo:', torneo.nombre, 'ID:', torneo.id);
    console.log('Tabla de posiciones actual:', torneo.tablaPosiciones);
    return torneo.tablaPosiciones ? torneo.tablaPosiciones.length : 0;
  }
  // Variables en la clase
  showDeleteModal = false;
  torneoAEliminar: any = null;

  // Método para abrir el modal
  confirmarEliminacion(torneo: any) {
    this.torneoAEliminar = torneo;
    this.showDeleteModal = true;
  }

  // Método para ejecutar el borrado
  ejecutarEliminacion() {
    if (!this.torneoAEliminar) return;

    this.torneosService.deleteTorneo(this.torneoAEliminar.id).subscribe({
      next: () => {
        toast.success('Torneo eliminado');
        this.showDeleteModal = false;
        this.cargarTorneos(); // Recarga la lista
      },
      error: () => toast.error('Error al eliminar'),
    });
  }
}
