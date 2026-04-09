import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { PartidosService } from '../../../core/services/partido.service';
import { TorneosService } from '../../../core/services/torneos.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-fixture-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fixture-management.html',
})
export class FixtureManagement implements OnInit {
  private route = inject(ActivatedRoute);
  private partidosService = inject(PartidosService);
  private torneosService = inject(TorneosService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  public readonly apiUrl = environment.apiUrl;
  public esAdmin: boolean = false;
  torneoId: string | null = null;
  torneoNombre: string = 'Cargando...';
  mostrarTabla = false;

  jornadasIds: number[] = [];
  jornadaSeleccionada: number = 1;
  partidos: any[] = [];
  tablaPosiciones: any[] = [];

  // Modal Match Report
  showScoreModal = false;
  modoLectura = false;
  partidoSeleccionado: any = null;

  // Modal Invitado (Jugador manual en acta)
  showInvitadoModal = false;
  equipoInvitado: 'local' | 'visitante' = 'local';
  nuevoInvitado = { nombre: '', numero: '' };

  // Totales y Staff
  gLocal = 0;
  gVisitante = 0;
  htLocal = 0;
  htVisitante = 0;
  arbitro1 = '';
  arbitro2 = '';
  cronometrista = '';
  observaciones = '';
  passwordAdmin = '';
  private readonly PASS_ADMIN_SECRETA = 'Planilla_fede2026';

  jugadoresLocal: any[] = [];
  jugadoresVisitante: any[] = [];
  [key: string]: any;

  ngOnInit() {
    this.torneoId = this.route.snapshot.paramMap.get('id');

    // 2. Definimos quién puede gestionar (Admin y Oficial de Mesa)
    this.esAdmin =
      this.authService.isAdmin() ||
      this.authService.isOficialMesa() ||
      this.authService.isJefeArbitros();

    if (this.torneoId) {
      this.cargarDatosIniciales();
      this.cargarTabla();
    }
  }

  cargarDatosIniciales() {
    this.torneosService.getTorneoById(this.torneoId!).subscribe((t) => {
      this.torneoNombre = t.nombre;
      this.partidosService.getJornadasDisponibles(this.torneoId!).subscribe((ids) => {
        this.jornadasIds = ids;
        if (this.jornadasIds.length > 0) this.cargarFixture(this.jornadasIds[0]);
        this.cdr.detectChanges();
      });
    });
  }

  cargarFixture(num: number) {
    this.jornadaSeleccionada = num;
    this.partidos = [];
    this.partidosService.getPartidosByJornada(this.torneoId!, num).subscribe({
      next: (data) => {
        this.partidos = data;
        this.cdr.detectChanges();
      },
    });
  }

  cargarTabla() {
    this.partidosService.getTablaPosiciones(this.torneoId!).subscribe((data) => {
      this.tablaPosiciones = data;
      this.cdr.detectChanges();
    });
  }

  cargarResultados(partido: any) {
    this.partidoSeleccionado = partido;
    this.modoLectura = partido.estado === 'Finalizado';
    this.limpiarDatosModal();

    if (this.modoLectura) {
      this.gLocal = partido.golesLocal;
      this.gVisitante = partido.golesVisitante;
      this.htLocal = partido.golesLocalHT;
      this.htVisitante = partido.golesVisitanteHT;
      this.arbitro1 = partido.arbitro1;
      this.arbitro2 = partido.arbitro2;
      this.cronometrista = partido.cronometrista;
      this.observaciones = partido.observaciones;
    }

    this.showScoreModal = true;

    // Carga de listas oficiales (siempre existen local y visitante como objetos Club)
    this.cargarListaEquipo(partido.localId, 'local', partido.eventos);
    this.cargarListaEquipo(partido.visitanteId, 'visitante', partido.eventos);
  }

  private cargarListaEquipo(clubId: string, lado: 'local' | 'visitante', eventos: any[]) {
    this.partidosService.getJugadoresPorClub(clubId).subscribe({
      next: (res) => {
        // 1. Mapeamos los jugadores oficiales
        const oficialesMapeados = res.map((j: any) => this.mapearJugador(j, eventos));

        // 2. BUSCAR INVITADOS MANUALES EN LOS EVENTOS
        // Filtramos eventos de este equipo que no tengan jugadorId y agrupamos por nombre
        const eventosInvitados = eventos.filter((e) => e.equipoId === clubId && !e.jugadorId);
        const nombresUnicos = [...new Set(eventosInvitados.map((e) => e.nombreInvitado))];

        const invitadosMapeados = nombresUnicos.map((nombre) => {
          // Buscamos el primer evento de este invitado para sacar su número (dorsal)
          const primerEvento = eventosInvitados.find((e) => e.nombreInvitado === nombre);
          return {
            id: null, // Identificador de que es invitado manual
            nombreCompleto: nombre,
            numero: primerEvento?.numeroInvitado || 0,
            goles: eventosInvitados.filter((e) => e.nombreInvitado === nombre && e.tipo === 'GOL')
              .length,
            am: eventosInvitados.filter((e) => e.nombreInvitado === nombre && e.tipo === 'AMARILLA')
              .length,
            excl: eventosInvitados.filter(
              (e) => e.nombreInvitado === nombre && e.tipo === 'DOS_MINUTOS',
            ).length,
            roja: eventosInvitados.some((e) => e.nombreInvitado === nombre && e.tipo === 'ROJA'),
            azul: eventosInvitados.some((e) => e.nombreInvitado === nombre && e.tipo === 'AZUL'),
          };
        });

        // 3. Unimos ambas listas
        const listaCompleta = [...oficialesMapeados, ...invitadosMapeados];

        if (lado === 'local') this.jugadoresLocal = listaCompleta;
        else this.jugadoresVisitante = listaCompleta;

        this.cdr.detectChanges();
      },
      error: () => toast.error(`Error al cargar lista del equipo ${lado}`),
    });
  }

  private mapearJugador(j: any, eventos: any[]) {
    const ev = eventos || [];
    return {
      id: j.id,
      nombreCompleto: j.nombreCompleto,
      numero: j.numero || 0,
      goles: ev.filter((e) => e.jugadorId === j.id && e.tipo === 'GOL').length,
      am: ev.filter((e) => e.jugadorId === j.id && e.tipo === 'AMARILLA').length,
      excl: ev.filter((e) => e.jugadorId === j.id && e.tipo === 'DOS_MINUTOS').length,
      roja: ev.some((e) => e.jugadorId === j.id && e.tipo === 'ROJA'),
      azul: ev.some((e) => e.jugadorId === j.id && e.tipo === 'AZUL'),
    };
  }

  confirmarResultado(): void {
    // 1. Validaciones con guard clauses limpias
    if (this.passwordAdmin !== this.PASS_ADMIN_SECRETA) {
      toast.error('PIN incorrecto');
      return;
    }

    if (this.htLocal > this.gLocal || this.htVisitante > this.gVisitante) {
      toast.error('HT incoherente: los goles al entretiempo no pueden superar al final');
      return;
    }

    const sumaGolesLocal = this.jugadoresLocal.reduce((acc, j) => acc + (j.goles || 0), 0);
    const sumaGolesVisitante = this.jugadoresVisitante.reduce((acc, j) => acc + (j.goles || 0), 0);

    if (sumaGolesLocal !== this.gLocal || sumaGolesVisitante !== this.gVisitante) {
      toast.error('La suma de goles individuales no coincide con el total del marcador');
      return;
    }

    // 2. Preparación de la planilla
    const planillaFinal = [
      ...this.jugadoresLocal.map((j) => ({
        ...j,
        equipoId: this.partidoSeleccionado.localId,
        jugadorId: j.id,
        nombreCompleto: j.nombreCompleto,
      })),
      ...this.jugadoresVisitante.map((j) => ({
        ...j,
        equipoId: this.partidoSeleccionado.visitanteId,
        jugadorId: j.id,
        nombreCompleto: j.nombreCompleto,
      })),
    ].filter(
      (j) =>
        // CONDICIÓN ACTUALIZADA:
        // 1. Si tiene alguna estadística (Goles, AM, Excl, Rojas, Azules)
        j.goles > 0 ||
        j.am > 0 ||
        j.excl > 0 ||
        j.roja ||
        j.azul ||
        // 2. O SI ES UN INVITADO (queremos que quede registrado en el acta aunque no anote)
        j.id === null,
    );

    // 3. Construcción del Payload
    const payload = {
      golesLocal: Number(this.gLocal),
      golesVisitante: Number(this.gVisitante),
      golesLocalHT: Number(this.htLocal),
      golesVisitanteHT: Number(this.htVisitante),
      arbitro1: this.arbitro1,
      arbitro2: this.arbitro2,
      cronometrista: this.cronometrista,
      observaciones: this.observaciones,
      detallesJugadores: planillaFinal,
    };

    // 4. Envío al Servidor
    this.partidosService.updateResultado(this.partidoSeleccionado.id, payload).subscribe({
      next: () => {
        this.showScoreModal = false;
        this.cargarFixture(this.jornadaSeleccionada);
        this.cargarTabla();
        toast.success('Acta oficializada correctamente');
      },
      error: (err) => {
        console.error(err);
        toast.error('Error: ' + (err.error?.error || 'No se pudo guardar el acta'));
      },
    });
  }

  // --- MÉTODOS DE APOYO ---
  limpiarDatosModal() {
    this.gLocal = 0;
    this.gVisitante = 0;
    this.htLocal = 0;
    this.htVisitante = 0;
    this.arbitro1 = '';
    this.arbitro2 = '';
    this.cronometrista = '';
    this.observaciones = '';
    this.passwordAdmin = '';
    this.jugadoresLocal = [];
    this.jugadoresVisitante = [];
  }

  abrirModalInvitado(equipo: 'local' | 'visitante') {
    this.equipoInvitado = equipo;
    this.nuevoInvitado = { nombre: '', numero: '' };
    this.showInvitadoModal = true;
  }

  confirmarInvitado() {
    const inv = {
      id: null, // Jugador invitado manual
      nombreCompleto: this.nuevoInvitado.nombre.toUpperCase(),
      numero: this.nuevoInvitado.numero,
      goles: 0,
      am: 0,
      excl: 0,
      roja: false,
      azul: false,
    };
    if (this.equipoInvitado === 'local') this.jugadoresLocal = [...this.jugadoresLocal, inv];
    else this.jugadoresVisitante = [...this.jugadoresVisitante, inv];
    this.showInvitadoModal = false;
  }

  trackByPartidoId(index: number, partido: any): string {
    return partido.id;
  }
}
