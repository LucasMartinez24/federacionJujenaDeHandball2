import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-club-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './club-dashboard.html',
})
export class ClubDashboard implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); // Inyectamos el detector de cambios

  public readonly apiUrl = environment.apiUrl;
  partidos: any[] = [];
  loading: boolean = true; // Estado de carga
  categoriasDisponibles: string[] = ['Todas'];
  filtroCategoria: string = 'Todas';

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (user?.id) {
      this.cargarAgenda(user.id);
    }
  }

  cargarAgenda(clubId: string) {
    this.loading = true; // Empezamos a cargar
    this.partidos = []; // Limpiamos lo anterior para evitar basura visual

    this.http.get<any[]>(`${this.apiUrl}/clubes/${clubId}/agenda-completa`).subscribe({
      next: (data) => {
        this.partidos = data;

        // Extraemos categorías
        const cats = data.map((p) => p.torneo.categoria);
        this.categoriasDisponibles = ['Todas', ...new Set(cats)];

        this.loading = false; // Finaliza la carga

        // FORZAMOS LA ACTUALIZACIÓN DE LA VISTA
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get partidosFiltrados() {
    if (this.filtroCategoria === 'Todas') return this.partidos;
    return this.partidos.filter((p) => p.torneo.categoria === this.filtroCategoria);
  }

  get proximosPartidos() {
    return this.partidosFiltrados.filter((p) => p.estado !== 'Finalizado');
  }

  get resultadosPasados() {
    return this.partidosFiltrados.filter((p) => p.estado === 'Finalizado');
  }
}
