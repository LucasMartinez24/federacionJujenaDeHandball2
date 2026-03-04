import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TorneosService } from '../../../core/services/torneos.service';
import { toast } from 'ngx-sonner';
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

  torneos: any[] = [];
  filtroActual: string = 'Active';
  searchText: string = '';
  loading = false;

  ngOnInit(): void {
    this.cargarTorneos();
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
}
