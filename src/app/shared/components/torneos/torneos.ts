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
  esOficial: boolean = false;
  puedeGestionar: boolean = false; // Nueva variable para simplificar el HTML

  ngOnInit() {
    const user = this.authService.getCurrentUser();

    // Definimos roles
    this.esAdmin = this.authService.isAdmin();
    this.esOficial = this.authService.isOficialMesa();

    // El Representante también se considera gestión en este contexto si así lo deseas
    const esRep = this.authService.isRepFederacion();

    // "puedeGestionar" agrupa a quienes pueden crear y administrar fixture
    this.puedeGestionar = this.esAdmin || this.esOficial || esRep;
    this.cargarTorneos();
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
        this.filtroActual === 'All'
          ? true
          : this.filtroActual === 'Active'
          ? t.estado === 'In Progress'
          : this.filtroActual === 'Upcoming'
          ? t.estado === 'Upcoming'
          : this.filtroActual === 'Finalizado'
          ? t.estado === 'Finalizado'
          : t.estado === 'Archive';

      const matchSearch =
        (t.nombre || '').toLowerCase().includes(this.searchText.toLowerCase()) ||
        (t.categoria || '').toLowerCase().includes(this.searchText.toLowerCase());

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

  // === CAMBIO DE ESTADO ===
  showEstadoModal = false;
  torneoACambiarEstado: any = null;
  nuevoEstado: string = '';

  estadosDisponibles = [
    { valor: 'In Progress', label: 'En Curso', icono: 'play_circle', color: 'emerald' },
    { valor: 'Upcoming', label: 'Próximo', icono: 'schedule', color: 'amber' },
    { valor: 'Finalizado', label: 'Finalizado', icono: 'check_circle', color: 'blue' },
    { valor: 'Archive', label: 'Archivado', icono: 'inventory_2', color: 'slate' },
  ];

  abrirCambioEstado(torneo: any) {
    this.torneoACambiarEstado = torneo;
    this.nuevoEstado = torneo.estado;
    this.showEstadoModal = true;
  }

  ejecutarCambioEstado() {
    if (!this.torneoACambiarEstado || !this.nuevoEstado) return;

    this.torneosService.updateTorneo(this.torneoACambiarEstado.id, { estado: this.nuevoEstado }).subscribe({
      next: () => {
        toast.success(`Estado actualizado a "${this.estadosDisponibles.find(e => e.valor === this.nuevoEstado)?.label}"`);
        this.showEstadoModal = false;
        this.torneoACambiarEstado = null;
        this.cargarTorneos();
      },
      error: () => toast.error('Error al actualizar el estado del torneo'),
    });
  }

  getEstadoInfo(estado: string) {
    switch (estado) {
      case 'In Progress':
        return { label: 'En Curso', clase: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icono: 'play_circle' };
      case 'Upcoming':
        return { label: 'Próximo', clase: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icono: 'schedule' };
      case 'Finalizado':
        return { label: 'Finalizado', clase: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icono: 'check_circle' };
      case 'Archive':
        return { label: 'Archivado', clase: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icono: 'inventory_2' };
      default:
        return { label: estado || 'En Curso', clase: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icono: 'play_circle' };
    }
  }
}
