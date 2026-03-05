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
    this.torneoId = this.route.snapshot.paramMap.get('id');
    this.cargarClubes();

    if (this.torneoId) {
      this.cargarFixtureExistente(); // <--- Nueva llamada
    }
  }

  cargarFixtureExistente() {
    this.partidosService.getFixtureByTorneo(this.torneoId!).subscribe({
      next: (partidos) => {
        if (partidos && partidos.length > 0) {
          // Agrupamos los partidos por el campo 'jornada'
          const jornadasMap = partidos.reduce((acc: any, partido: any) => {
            const num = partido.jornada;
            if (!acc[num]) {
              acc[num] = { numero: num, partidos: [] };
            }

            // Formateamos el partido para que coincida con lo que espera el HTML
            // En fixture-generator.ts, dentro de cargarFixtureExistente()
            acc[num].partidos.push({
              id: partido.id,
              local: partido.local,
              visitante: partido.visitante,
              // Usamos substring para obtener la fecha exacta del string sin procesar como Date
              fecha: partido.fecha ? partido.fecha.substring(0, 10) : '',
              // Extraemos los caracteres de la hora (HH:mm) directamente del string ISO
              hora: partido.fecha ? new Date(partido.fecha).toTimeString().substring(0, 5) : '',
              lugar: partido.lugar || '',
            });
            console.log('Partido procesado:', acc[num].partidos[acc[num].partidos.length - 1]);
            return acc;
          }, {});

          this.jornadas = Object.values(jornadasMap);

          // Opcional: Marcar como seleccionados los clubes que ya tienen partidos
          const idsClubes = new Set();
          partidos.forEach((p: any) => {
            idsClubes.add(p.localId);
            idsClubes.add(p.visitanteId);
          });

          // Sincronizamos clubesSeleccionados cuando clubesDisponibles termine de cargar
          this.clubesService.getClubes().subscribe((data) => {
            this.clubesSeleccionados = data.filter((c: any) => idsClubes.has(c.id));
            this.cdr.detectChanges();
          });

          this.cdr.detectChanges();
          toast.info('Se cargó el fixture existente para edición');
        }
      },
    });
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
      // Guardamos los valores tal cual vienen de los inputs de tipo date y time
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
