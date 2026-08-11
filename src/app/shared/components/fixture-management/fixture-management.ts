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
  [key: string]: any;
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
  planillaObligatoria = true;
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
    this.partidosService.getPartidosByJornada(this.torneoId!, num).subscribe((data) => {
      this.partidos = data;
      this.cdr.detectChanges();
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
    this.planillaObligatoria = true;
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
        const catTorneo = this.torneoCategoria?.toLowerCase().trim() || '';
        const ramaTorneo = this.torneoRama?.toLowerCase().trim() || '';

        const oficialesMapeados = res
          .filter((j: any) => {
            const catBase = j.categoria?.toLowerCase().trim() || '';
            const catEspecial = j.categoriaEspecial?.toLowerCase().trim() || '';
            const generoJugador = j.genero?.toLowerCase().trim() || '';

            const esGeneroCorrecto = !ramaTorneo || generoJugador.includes(ramaTorneo);
            if (!esGeneroCorrecto) return false;

            if (catTorneo.includes('+35')) {
              return catEspecial.includes('+35');
            }
            if (catTorneo.includes('primera')) {
              const esDePrimeraOJuvenil =
                catBase.includes('primera') || catBase.includes('juvenil');
              const esVeterano = catEspecial.includes('+35');
              return esDePrimeraOJuvenil && !esVeterano;
            }
            return catBase.includes(catTorneo);
          })
          .map((j: any) => this.mapearJugador(j, eventos));

        const invitadosMapeados = (eventos || [])
          .filter((e) => e.equipoId === clubId && !e.jugadorId && e.tipo === 'PRESENCIA')
          .map((e) => ({
            id: null,
            nombreCompleto: e.nombreInvitado,
            numero: e.numeroInvitado,
            goles: eventos.filter(
              (ev) => ev.nombreInvitado === e.nombreInvitado && ev.tipo === 'GOL',
            ).length,
            am: eventos.filter(
              (ev) => ev.nombreInvitado === e.nombreInvitado && ev.tipo === 'AMARILLA',
            ).length,
            excl: eventos.filter(
              (ev) => ev.nombreInvitado === e.nombreInvitado && ev.tipo === 'DOS_MINUTOS',
            ).length,
            roja: eventos.some(
              (ev) => ev.nombreInvitado === e.nombreInvitado && ev.tipo === 'ROJA',
            ),
            azul: eventos.some(
              (ev) => ev.nombreInvitado === e.nombreInvitado && ev.tipo === 'AZUL',
            ),
          }));

        const listaFinal = [...oficialesMapeados, ...invitadosMapeados];
        if (lado === 'local') this.jugadoresLocal = listaFinal;
        else this.jugadoresVisitante = listaFinal;
        this.cdr.detectChanges();
      },
    });
  }

  private mapearJugador(j: any, eventos: any[]) {
    const ev = eventos || [];
    const dorsalActa = ev.find(
      (e) => e.jugadorId === j.id && e.tipo === 'PRESENCIA',
    )?.numeroInvitado;
    return {
      id: j.id,
      nombreCompleto: j.nombreCompleto,
      numero: dorsalActa || 0,
      goles: ev.filter((e) => e.jugadorId === j.id && e.tipo === 'GOL').length,
      am: ev.filter((e) => e.jugadorId === j.id && e.tipo === 'AMARILLA').length,
      excl: ev.filter((e) => e.jugadorId === j.id && e.tipo === 'DOS_MINUTOS').length,
      roja: ev.some((e) => e.jugadorId === j.id && e.tipo === 'ROJA'),
      azul: ev.some((e) => e.jugadorId === j.id && e.tipo === 'AZUL'),
    };
  }

  confirmarResultado(): void {
    const toNumber = (value: any) => Number(value) || 0;

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
    ].filter((j) => toNumber(j.numero) > 0 || j.id === null);

    if (this.planillaObligatoria) {
      const sumaGLocal = this.jugadoresLocal.reduce((acc, j) => acc + toNumber(j.goles), 0);
      const sumaGVisitante = this.jugadoresVisitante.reduce((acc, j) => acc + toNumber(j.goles), 0);
      const tieneGolesIndividuales =
        this.jugadoresLocal.some((j) => toNumber(j.goles) > 0) ||
        this.jugadoresVisitante.some((j) => toNumber(j.goles) > 0);

      if (
        tieneGolesIndividuales &&
        (sumaGLocal !== toNumber(this.gLocal) || sumaGVisitante !== toNumber(this.gVisitante))
      ) {
        toast.error('La suma de goles individuales no coincide');
        return;
      }
    }

    this.partidosService
      .updateResultado(this.partidoSeleccionado.id, {
        golesLocal: toNumber(this.gLocal),
        golesVisitante: toNumber(this.gVisitante),
        golesLocalHT: toNumber(this.htLocal),
        golesVisitanteHT: toNumber(this.htVisitante),
        arbitro1: this.arbitro1,
        arbitro2: this.arbitro2,
        cronometrista: this.cronometrista,
        observaciones: this.observaciones,
        detallesJugadores: this.planillaObligatoria ? planillaFinal : [],
      })
      .subscribe({
        next: () => {
          this.showScoreModal = false;
          this.cargarFixture(this.jornadaSeleccionada);
          this.cargarTabla();
          toast.success('Acta oficializada');
        },
        error: (error) => {
          toast.error(error?.error?.error || 'No se pudo oficializar el acta');
        },
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
    this.planillaObligatoria = true;
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
      numero: Number(this.nuevoInvitado.numero),
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
    this.cdr.detectChanges();
  }

  trackByPartidoId(index: number, partido: any) {
    return partido.id;
  }
}
