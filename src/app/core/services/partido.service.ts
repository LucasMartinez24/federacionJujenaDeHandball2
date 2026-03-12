import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PartidosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/partidos';

  // Algoritmo Round Robin para generar las jornadas
  generarFixture(clubes: any[], idaVuelta: boolean = false): any[] {
    let equipos = [...clubes];
    if (equipos.length % 2 !== 0) equipos.push({ id: null, nombre: 'DESCANSA' });

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
      equipos.splice(1, 0, equipos.pop()!); // Rotación
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
  getJornadasDisponibles(torneoId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/torneo/${torneoId}/jornadas`);
  }
  // Obtiene los partidos de una jornada específica
  getPartidosByJornada(torneoId: string, jornada: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/torneo/${torneoId}/jornada/${jornada}`);
  }
  getFixtureByTorneo(torneoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/torneo/${torneoId}`);
  }
  saveFixture(torneoId: string, jornadas: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk`, { torneoId, jornadas });
  }
  updateResultado(
    id: string,
    data: { golesLocal: number; golesVisitante: number },
  ): Observable<any> {
    // Usamos patch ya que solo actualizamos una parte del recurso (el resultado)
    return this.http.patch(`${this.apiUrl}/${id}/resultado`, data);
  }
  getTablaPosiciones(torneoId: string): Observable<any[]> {
    // Asegúrate de que la URL coincida con tu backend
    return this.http.get<any[]>(`http://localhost:3000/api/posiciones/torneo/${torneoId}`);
  }
}
