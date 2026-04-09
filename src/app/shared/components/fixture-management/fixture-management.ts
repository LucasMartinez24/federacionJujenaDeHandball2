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
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  public readonly apiUrl = environment.apiUrl;
  public esAdmin: boolean = false;
  torneoId: string | null = null;
  torneoNombre: string = 'Cargando...';
  torneoCategoria: string = '';
  mostrarTabla = false;

  jornadasIds: number[] = [];
  jornadaSeleccionada: number = 1;
  partidos: any[] = [];
  tablaPosiciones: any[] = [];

  // Modal Match Report
  showScoreModal = false;
  modoLectura = false;
  partidoSeleccionado: any = null;

  // Modal Invitado
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
  [key: string]: any;
  jugadoresLocal: any[] = [];
  jugadoresVisitante: any[] = [];

  // Mapeo de categorías permitidas (Regla FJH)
  private readonly CATEGORIAS_PERMITIDAS: { [key: string]: string[] } = {
    Primera: ['Primera', 'Juveniles'],
    Juveniles: ['Juveniles', 'Cadetes'],
    Cadetes: ['Cadetes', 'Menores'],
    Menores: ['Menores', 'Infantiles'],
    Infantiles: ['Infantiles', 'Pre-Infantiles'],
  };

  ngOnInit() {
    this.torneoId = this.route.snapshot.paramMap.get('id');
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
      this.torneoCategoria = t.categoria;
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
    this.cargarListaEquipo(partido.localId, 'local', partido.eventos);
    this.cargarListaEquipo(partido.visitanteId, 'visitante', partido.eventos);
  }

  private cargarListaEquipo(clubId: string, lado: 'local' | 'visitante', eventos: any[]) {
    this.partidosService.getJugadoresPorClub(clubId).subscribe({
      next: (res) => {
        // 1. Obtenemos la categoría tal cual viene del torneo
        const catTorneoOriginal = this.torneoCategoria;

        // 2. Mapa de permisos (Claves exactas de tu <select>)
        const mapaPermitidas: { [key: string]: string[] } = {
          'Primera División': ['primera', 'juveniles'],
          '+35': ['primera', '+35 (veteranos)', 'ambas (primera y +35)'],
          Juveniles: ['juveniles', 'cadetes'],
          Cadetes: ['cadetes', 'menores'],
          Menores: ['menores', 'infantiles'],
          Infantiles: ['infantiles', 'pre-infantiles'],
        };

        // 3. Obtenemos las categorías permitidas
        // Usamos trim() para evitar errores por espacios invisibles
        const aptasRaw = mapaPermitidas[catTorneoOriginal] || [catTorneoOriginal];

        // Convertimos todo a minúsculas para una comparación "ciega" y segura
        const aptas = aptasRaw.map((a) => a.toLowerCase().trim());

        console.log(`--- CARGA FJH: ${catTorneoOriginal} ---`);

        // 4. Filtrado de jugadores
        const oficialesMapeados = res
          .filter((j: any) => {
            if (!j.categoria) return false;

            const catJugador = j.categoria.toLowerCase().trim();
            const esApto = aptas.includes(catJugador);

            if (!esApto) {
              console.warn(
                `Jugador excluido: ${j.nombreCompleto} (${j.categoria}) no apto para ${catTorneoOriginal}`,
              );
            }
            return esApto;
          })
          .map((j: any) => this.mapearJugador(j, eventos));

        // 5. Mapeo de invitados (sin cambios)
        const eventosInvitados = eventos.filter((e) => e.equipoId === clubId && !e.jugadorId);
        const nombresUnicos = [...new Set(eventosInvitados.map((e) => e.nombreInvitado))];
        const invitadosMapeados = nombresUnicos.map((nombre) => {
          const primerEvento = eventosInvitados.find((e) => e.nombreInvitado === nombre);
          return {
            id: null,
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

        const listaCompleta = [...oficialesMapeados, ...invitadosMapeados];

        if (lado === 'local') this.jugadoresLocal = listaCompleta;
        else this.jugadoresVisitante = listaCompleta;

        this.cdr.detectChanges();
      },
      error: () => toast.error(`Error al cargar equipo ${lado}`),
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

  // --- ELIMINAR JUGADOR INVITADO ---
  eliminarInvitado(lista: any[], index: number) {
    if (this.modoLectura) return;
    lista.splice(index, 1);
    toast.info('Invitado removido del acta');
    this.cdr.detectChanges();
  }

  confirmarResultado(): void {
    if (this.passwordAdmin !== this.PASS_ADMIN_SECRETA) {
      toast.error('PIN incorrecto');
      return;
    }

    const sumaGLocal = this.jugadoresLocal.reduce((acc, j) => acc + (j.goles || 0), 0);
    const sumaGVisitante = this.jugadoresVisitante.reduce((acc, j) => acc + (j.goles || 0), 0);

    if (sumaGLocal !== this.gLocal || sumaGVisitante !== this.gVisitante) {
      toast.error('La suma de goles individuales no coincide con el marcador global');
      return;
    }

    const planillaFinal = [
      ...this.jugadoresLocal.map((j) => ({
        ...j,
        equipoId: this.partidoSeleccionado.localId,
        jugadorId: j.id,
      })),
      ...this.jugadoresVisitante.map((j) => ({
        ...j,
        equipoId: this.partidoSeleccionado.visitanteId,
        jugadorId: j.id,
      })),
    ].filter((j) => j.goles > 0 || j.am > 0 || j.excl > 0 || j.roja || j.azul || j.id === null);

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

    this.partidosService.updateResultado(this.partidoSeleccionado.id, payload).subscribe({
      next: () => {
        this.showScoreModal = false;
        this.cargarFixture(this.jornadaSeleccionada);
        this.cargarTabla();
        toast.success('Acta oficializada');
      },
      error: (err) => toast.error('Error al guardar: ' + err.error?.error),
    });
  }

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
      id: null,
      nombreCompleto: this.nuevoInvitado.nombre.toUpperCase(),
      numero: this.nuevoInvitado.numero,
      goles: 0,
      am: 0,
      excl: 0,
      roja: false,
      azul: false,
    };
    if (this.equipoInvitado === 'local') this.jugadoresLocal.push(inv);
    else this.jugadoresVisitante.push(inv);
    this.showInvitadoModal = false;
  }

  trackByPartidoId(index: number, partido: any): string {
    return partido.id;
  }
}
