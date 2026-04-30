import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { PartidosService } from '../../../core/services/partido.service';
import { ClubesService } from '../../../core/services/clubes.service';
import { environment } from '../../../../environments/environment';

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
  private cdr = inject(ChangeDetectorRef);

  public readonly apiUrl = environment.apiUrl;
  torneoId: string | null = null;
  clubesDisponibles: any[] = [];
  clubesSeleccionados: any[] = [];
  jornadas: any[] = [];

  // Modales
  showManualModal = false;
  showProgramadorModal = false;
  showDeleteModal = false;

  // Temporales para asignación
  jornadaDestino: any = null;
  jornadaOrigen: any = null;
  partidoArrastrado: any = null;
  tempLocal: any = null;
  tempVisitante: any = null;
  partidoAProgramar: any = null;
  partidoABorrar: any = null;

  fechaTemp: string = '';
  horaTemp: string = '';
  lugarTemp: string = '';

  ngOnInit() {
    this.torneoId = this.route.snapshot.paramMap.get('id');
    this.cargarClubes();
    if (this.torneoId) this.cargarFixtureExistente();
  }

  cargarClubes() {
    this.clubesService.getClubes().subscribe((data) => {
      this.clubesDisponibles = data;
      this.cdr.detectChanges();
    });
  }

  cargarFixtureExistente() {
    this.partidosService.getFixtureByTorneo(this.torneoId!).subscribe({
      next: (partidos) => {
        if (!partidos || partidos.length === 0) return;

        const jornadasMap = partidos.reduce((acc: any, p: any) => {
          const num = p.jornada;
          if (!acc[num]) acc[num] = { numero: num, partidos: [] };

          acc[num].partidos.push({
            id: p.id,
            local: p.local,
            visitante: p.visitante,
            fecha: p.fecha ? p.fecha.split('T')[0] : '',
            hora: p.fecha ? new Date(p.fecha).toTimeString().substring(0, 5) : '',
            lugar: p.lugar || '',
            estado: p.estado,
          });
          return acc;
        }, {});

        this.jornadas = Object.values(jornadasMap);
        this.actualizarClubesSeleccionadosDesdeFixture();
        this.cdr.detectChanges();
      },
    });
  }

  actualizarClubesSeleccionadosDesdeFixture() {
    const equiposEnFixture = new Map();
    this.jornadas.forEach((j) => {
      j.partidos.forEach((p: any) => {
        equiposEnFixture.set(p.local.id, p.local);
        equiposEnFixture.set(p.visitante.id, p.visitante);
      });
    });
    this.clubesSeleccionados = Array.from(equiposEnFixture.values());
  }

  // --- GESTIÓN DE INVITADOS (REGISTRO REAL EN DB) ---
  anadirInvitadoALista(nombre: string) {
    if (!nombre || nombre.trim() === '') return;

    // Verificamos si ya existe localmente para no re-crear
    const existe = this.clubesDisponibles.find(
      (c) => c.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    if (existe) {
      if (!this.isSeleccionado(existe.id)) this.toggleClub(existe);
      return;
    }

    const siglas = nombre.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 10);

    this.clubesService.crearClubInvitado({ nombre, siglas }).subscribe({
      next: (nuevoClub) => {
        this.clubesDisponibles.push(nuevoClub);
        this.clubesSeleccionados.push(nuevoClub);
        toast.success(`Equipo "${nuevoClub.nombre}" registrado`);
        this.cdr.detectChanges();
      },
      error: (err) => toast.error('Error al registrar: ' + err.error.error),
    });
  }

  // --- GESTIÓN DE SELECCIÓN ---
  toggleClub(club: any) {
    const index = this.clubesSeleccionados.findIndex((c) => c.id === club.id);
    if (index > -1) this.clubesSeleccionados.splice(index, 1);
    else this.clubesSeleccionados.push(club);
    this.cdr.detectChanges();
  }

  isSeleccionado(id: string) {
    return this.clubesSeleccionados.some((c) => c.id === id);
  }

  // --- ACCIONES DE FIXTURE ---
  agregarNuevaJornada() {
    this.jornadas.push({ numero: this.jornadas.length + 1, partidos: [] });
  }

  eliminarJornada(index: number) {
    this.jornadas.splice(index, 1);
    this.jornadas.forEach((j, i) => (j.numero = i + 1));
  }

  prepararPartidoManual(jornada: any) {
    this.jornadaDestino = jornada;
    this.tempLocal = this.tempVisitante = null;
    this.showManualModal = true;
  }

  agregarPartidoManual() {
    if (this.tempLocal.id === this.tempVisitante.id) {
      toast.error('No pueden jugar contra sí mismos');
      return;
    }
    this.jornadaDestino.partidos.push({
      local: this.tempLocal,
      visitante: this.tempVisitante,
      fecha: '',
      hora: '',
      lugar: '',
      estado: 'Programado',
    });
    this.showManualModal = false;
  }

  // --- PERSISTENCIA ---
  publicarFixture() {
    const payload = this.jornadas.map((j) => ({
      numero: j.numero,
      partidos: j.partidos.map((p: any) => ({
        id: p.id || null,
        jornada: j.numero,
        localId: p.local.id,
        visitanteId: p.visitante.id,
        fecha: p.fecha || null,
        hora: p.hora || null,
        lugar: p.lugar || 'Sede a definir',
        estado: p.estado || 'Programado',
      })),
    }));

    this.partidosService.saveFixture(this.torneoId!, payload).subscribe({
      next: () => {
        toast.success('Fixture publicado exitosamente');
        this.router.navigate(['/torneos']);
      },
      error: (err) => toast.error('Error al publicar fixture'),
    });
  }

  // --- UTILIDADES ---
  abrirProgramador(partido: any) {
    this.partidoAProgramar = partido;
    this.fechaTemp = partido.fecha || '';
    this.horaTemp = partido.hora || '';
    this.lugarTemp = partido.lugar || '';
    this.showProgramadorModal = true;
  }

  confirmarProgramacion() {
    // Guardamos los valores temporales en el objeto del partido
    this.partidoAProgramar.fecha = this.fechaTemp;
    this.partidoAProgramar.hora = this.horaTemp;
    this.partidoAProgramar.lugar = this.lugarTemp;

    // Cerramos el modal
    this.showProgramadorModal = false;

    // Opcional: Notificación visual
    toast.info('Horario asignado temporalmente');
  }

  prepararBorrado(jornada: any, index: number) {
    this.partidoABorrar = { jornada, index, id: jornada.partidos[index].id };
    this.showDeleteModal = true;
  }

  confirmarBorrado() {
    const { jornada, index, id } = this.partidoABorrar;
    if (id) {
      this.partidosService.deletePartido(id).subscribe({
        next: () => {
          jornada.partidos.splice(index, 1);
          toast.success('Eliminado de la DB');
        },
      });
    } else {
      jornada.partidos.splice(index, 1);
    }
    this.showDeleteModal = false;
  }

  onDragStart(partido: any, jornada: any) {
    this.partidoArrastrado = partido;
    this.jornadaOrigen = jornada;
  }

  onDropPartido(event: any, jornadaDestino: any) {
    event.preventDefault();
    if (!this.partidoArrastrado) return;
    const idx = this.jornadaOrigen.partidos.indexOf(this.partidoArrastrado);
    if (idx > -1) {
      this.jornadaOrigen.partidos.splice(idx, 1);
      jornadaDestino.partidos.push(this.partidoArrastrado);
    }
    this.partidoArrastrado = null;
  }

  generarAutomatico() {
    this.jornadas = this.partidosService.generarFixture(this.clubesSeleccionados, false);
  }
}
