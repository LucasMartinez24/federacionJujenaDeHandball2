import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartidosService } from '../../../core/services/partido.service';
import { ClubesService } from '../../../core/services/clubes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-fixture-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fixture-generator.html',
})
export class FixtureGenerator implements OnInit {
  private partidosService = inject(PartidosService);
  private clubesService = inject(ClubesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  torneoId: string | null = null;
  clubesDisponibles: any[] = [];
  clubesSeleccionados: any[] = [];
  jornadas: any[] = [];
  showModal = false;
  partidoAProgramar: any = null;

  ngOnInit() {
    // Leemos el parámetro 'id' de la URL (path parameter)
    this.torneoId = this.route.snapshot.paramMap.get('id');

    console.log('ID del Torneo detectado:', this.torneoId);

    if (!this.torneoId) {
      toast.error('No se detectó el ID del torneo. Asegúrate de venir desde la lista de torneos.');
    }

    this.cargarClubes();
  }
  private cdr = inject(ChangeDetectorRef); // 2. Inyectalo aquí

  // ... tus variables ...

  cargarClubes() {
    this.clubesService.getClubes().subscribe({
      next: (data) => {
        this.clubesDisponibles = data;
        // 3. Avisa a Angular que los datos cambiaron para que actualice la vista
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar clubes', err);
      },
    });
  }

  toggleClub(club: any) {
    const index = this.clubesSeleccionados.findIndex((c) => c.id === club.id);
    if (index > -1) {
      this.clubesSeleccionados.splice(index, 1);
    } else {
      this.clubesSeleccionados.push(club);
    }
  }

  isSeleccionado(id: string) {
    return this.clubesSeleccionados.some((c) => c.id === id);
  }

  generar() {
    if (this.clubesSeleccionados.length < 2) {
      toast.error('Selecciona al menos 2 clubes');
      return;
    }
    this.jornadas = this.partidosService.generarFixture(this.clubesSeleccionados, false);
    this.cdr.detectChanges(); // 4. Fuerza la actualización aquí también
    toast.success('Fixture generado temporalmente');
  }
  fechaTemp: string = '';
  horaTemp: string = '';
  lugarTemp: string = '';

  abrirProgramador(partido: any) {
    this.partidoAProgramar = partido;
    // Si ya tiene datos, los cargamos en los inputs temporales
    this.fechaTemp = partido.fecha || '';
    this.horaTemp = partido.hora || '';
    this.lugarTemp = partido.lugar || '';
    this.showModal = true;
  }

  confirmarProgramacion() {
    if (this.partidoAProgramar) {
      // Guardamos los datos temporales en el objeto del partido dentro de las jornadas
      this.partidoAProgramar.fecha = this.fechaTemp;
      this.partidoAProgramar.hora = this.horaTemp;
      this.partidoAProgramar.lugar = this.lugarTemp;
    }
    this.showModal = false;
    this.cdr.detectChanges();
  }

  publicarFixture() {
    console.log('Publicando fixture para torneoId:', this.torneoId);
    console.log('Jornadas a publicar:', this.jornadas);
    if (!this.torneoId || this.jornadas.length === 0) {
      toast.error('No hay un fixture generado para publicar');
      return;
    }

    // Estructuramos el body exactamente como lo espera el backend
    const payload = {
      torneoId: this.torneoId,
      jornadas: this.jornadas,
    };

    this.partidosService.saveFixture(this.torneoId, payload.jornadas).subscribe({
      next: (res) => {
        toast.success(`Calendario publicado: ${res.count} partidos creados`);
        this.router.navigate(['/torneos']); // Volver a la lista
      },
      error: (err) => {
        console.error('Detalle del error:', err);
        toast.error(err.error?.error || 'Error 400: Revisa los datos enviados');
      },
    });
  }
}
