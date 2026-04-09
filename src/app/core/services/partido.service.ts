import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PartidosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // --- MÉTODOS DE FIXTURE ---

  getJornadasDisponibles(torneoId: string): Observable<number[]> {
    // Coincide con: router.get("/torneo/:torneoId/jornadas", ...)
    return this.http.get<number[]>(`${this.apiUrl}/partidos/torneo/${torneoId}/jornadas`);
  }

  getPartidosByJornada(torneoId: string, jornada: number): Observable<any[]> {
    // Coincide con: router.get("/torneo/:torneoId/jornada/:numero", ...)
    return this.http.get<any[]>(`${this.apiUrl}/partidos/torneo/${torneoId}/jornada/${jornada}`);
  }

  getFixtureByTorneo(torneoId: string): Observable<any[]> {
    // Coincide con: router.get("/torneo/:torneoId", ...)
    return this.http.get<any[]>(`${this.apiUrl}/partidos/torneo/${torneoId}`);
  }

  saveFixture(torneoId: string, jornadas: any[]): Observable<any> {
    // Coincide con: router.post("/torneo/:torneoId/fixture", ...)
    return this.http.post(`${this.apiUrl}/partidos/torneo/${torneoId}/fixture`, { jornadas });
  }

  // --- MÉTODOS DE RESULTADOS ---

  updateResultado(id: string, data: any): Observable<any> {
    // Coincide con: router.patch("/:id/resultado", ...)
    return this.http.patch(`${this.apiUrl}/partidos/${id}/resultado`, data);
  }

  getTablaPosiciones(torneoId: string): Observable<any[]> {
    // Coincide con tu controlador de posiciones.js: router.get("/torneo/:torneoId", ...)
    // Suponiendo que el index.js del backend lo tiene como app.use('/api/posiciones', ...)
    return this.http.get<any[]>(`${this.apiUrl}/posiciones/torneo/${torneoId}`);
  }

  deletePartido(partidoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/partidos/${partidoId}`);
  }

  // --- MÉTODOS DE APOYO ---

  getJugadoresPorClub(clubId: string): Observable<any[]> {
    // Asegúrate que tu backend tenga esta ruta en clubes.js o jugadores.js
    return this.http.get<any[]>(`${this.apiUrl}/clubes/${clubId}/jugadores`);
  }
}
