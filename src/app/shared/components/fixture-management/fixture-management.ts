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
  torneoRama: string = '';
  mostrarTabla = false;

  jornadasIds: number[] = [];
  jornadaSeleccionada: number = 1;
  partidos: any[] = [];
  tablaPosiciones: any[] = [];

  showScoreModal = false;
  modoLectura = false;
  partidoSeleccionado: any = null;

  showInvitadoModal = false;
  equipoInvitado: 'local' | 'visitante' = 'local';
  nuevoInvitado = { nombre: '', numero: '' };

  gLocal = 0;
  gVisitante = 0;
  htLocal = 0;
  htVisitante = 0;
  arbitro1 = '';
  arbitro2 = '';
  cronometrista = '';
  observaciones = '';

  jugadoresLocal: any[] = [];
  jugadoresVisitante: any[] = [];
  [key: string]: any;
  ngOnInit() {
    this.torneoId = this.route.snapshot.paramMap.get('id');
    this.esAdmin =
      this.authService.isAdmin() ||
      this.authService.isOficialMesa() ||
      this.authService.isJefeArbitros() ||
      this.authService.isRepFederacion();

    if (this.torneoId) {
      this.cargarDatosIniciales();
      this.cargarTabla();
    }
  }

  cargarDatosIniciales() {
    this.torneosService.getTorneoById(this.torneoId!).subscribe((t) => {
      this.torneoNombre = t.nombre;
      this.torneoCategoria = t.categoria;
      this.torneoRama = t.rama ? t.rama.trim().toLowerCase() : '';

      this.partidosService.getJornadasDisponibles(this.torneoId!).subscribe((ids) => {
        this.jornadasIds = ids;
        if (this.jornadasIds.length > 0) this.cargarFixture(this.jornadasIds[0]);
        this.cdr.detectChanges();
      });
    });
  }

  cargarFixture(num: number) {
    this.jornadaSeleccionada = num;
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
        // Normalizamos datos del Torneo
        const catTorneo = this.torneoCategoria?.toString().toLowerCase().trim() || '';
        const ramaTorneo = this.torneoRama?.toString().toLowerCase().trim() || '';

        const oficialesMapeados = res
          .filter((j: any) => {
            if (!j.categoria || !j.genero) return false;

            // 1. Normalización para evitar errores de espacios o mayúsculas
            const catBase = j.categoria.toString().toLowerCase().trim();
            const catEspecial = j.categoriaEspecial
              ? j.categoriaEspecial.toString().toLowerCase().trim()
              : '';
            const generoJugador = j.genero.toString().toLowerCase().trim();
            const catTorneo = this.torneoCategoria?.toString().toLowerCase().trim() || '';
            const ramaTorneo = this.torneoRama?.toString().toLowerCase().trim() || '';

            // 2. Validación de Rama (Género)
            const esGeneroCorrecto = !ramaTorneo || generoJugador.includes(ramaTorneo);
            if (!esGeneroCorrecto) return false;

            // --- LÓGICA DE EXCLUSIÓN SEGÚN EL TORNEO ---

            // CASO A: SI EL TORNEO ES +35
            if (catTorneo.includes('+35')) {
              // Solo entran los que tengan la marca especial de veterano
              return catEspecial.includes('+35');
            }

            // CASO B: SI EL TORNEO ES PRIMERA DIVISIÓN
            if (catTorneo.includes('primera')) {
              // 1. Debe decir 'primera' o 'juvenil' en la base
              const esDePrimeraOJuvenil =
                catBase.includes('primera') || catBase.includes('juvenil');

              // 2. LA REGLA DE ORO: Si el jugador tiene +35 en la categoría especial,
              // lo expulsamos de la lista de Primera para que no se mezcle.
              const esVeterano = catEspecial.includes('+35');

              return esDePrimeraOJuvenil && !esVeterano;
            }

            // CASO C: RESTO DE CATEGORÍAS (Menores, Cadetes, etc.)
            return catBase.includes(catTorneo);
          })
          .map((j: any) => this.mapearJugador(j, eventos));
        if (lado === 'local') this.jugadoresLocal = oficialesMapeados;
        else this.jugadoresVisitante = oficialesMapeados;

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

  confirmarResultado(): void {
    const sumaGLocal = this.jugadoresLocal.reduce((acc, j) => acc + (j.goles || 0), 0);
    const sumaGVisitante = this.jugadoresVisitante.reduce((acc, j) => acc + (j.goles || 0), 0);

    if (sumaGLocal !== Number(this.gLocal) || sumaGVisitante !== Number(this.gVisitante)) {
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

  eliminarInvitado(lista: any[], index: number) {
    if (this.modoLectura) return;
    lista.splice(index, 1);
    toast.info('Invitado removido');
    this.cdr.detectChanges();
  }

  trackByPartidoId(index: number, partido: any): string {
    return partido.id;
  }
}
