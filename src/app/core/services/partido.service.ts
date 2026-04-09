import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PartidosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Algoritmo Round Robin para generar las jornadas
  generarFixture(clubes: any[], idaVuelta: boolean = false): any[] {
    let equipos = [...clubes];
    if (equipos.length % 2 !== 0) {
      equipos.push({ id: null, nombre: 'DESCANSA' });
    }

    const numEquipos = equipos.length;
    const numJornadas = numEquipos - 1;
    const partidosPorJornada = numEquipos / 2;
    let jornadas = [];

    for (let i = 0; i < numJornadas; i++) {
      let partidos = [];
      for (let j = 0; j < partidosPorJornada; j++) {
        const local = equipos[j];
        const visitante = equipos[numEquipos - 1 - j];

        if (local.id && visitante.id) {
          partidos.push({ local, visitante, estado: 'Pendiente' });
        }
      }
      jornadas.push({ numero: i + 1, partidos });
      equipos.splice(1, 0, equipos.pop()!); // Rotación de equipos
    }

    if (idaVuelta) {
      const vueltas = jornadas.map((j) => ({
        numero: j.numero + numJornadas,
        partidos: j.partidos.map((p) => ({
          local: p.visitante,
          visitante: p.local,
          estado: 'Pendiente',
        })),
      }));
      jornadas = [...jornadas, ...vueltas];
    }

    console.log('Jornadas generadas:', jornadas);
    return jornadas;
  }

  /**
   * --- ENDPOINTS: PARTIDOS ---
   */

  // Obtiene los números de las jornadas (ej: [1, 2, 3...])
  getJornadasDisponibles(torneoId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/partidos/torneo/${torneoId}/jornadas`);
  }

  // Obtiene los partidos de una jornada específica
  getPartidosByJornada(torneoId: string, jornada: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/partidos/torneo/${torneoId}/jornada/${jornada}`);
  }

  // Obtiene el fixture completo de un torneo
  getFixtureByTorneo(torneoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/partidos/torneo/${torneoId}`);
  }

  // Guarda o sincroniza el fixture generado
  saveFixture(torneoId: string, jornadas: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/partidos/torneo/${torneoId}/fixture`, { jornadas });
  }

  // Oficializa resultados (Carga de planilla/Acta oficial)
  updateResultado(partidoId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/partidos/${partidoId}/resultado`, data);
  }

  // Elimina un partido (si no está finalizado)
  deletePartido(partidoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/partidos/${partidoId}`);
  }

  /**
   * --- ENDPOINTS: POSICIONES ---
   */

  getTablaPosiciones(torneoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/posiciones/torneo/${torneoId}`);
  }

  /**
   * --- ENDPOINTS: CLUBES / JUGADORES ---
   */

  // Obtiene los jugadores de un club para el acta del partido
  getJugadoresPorClub(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clubes/${clubId}/jugadores`);
  }
}
