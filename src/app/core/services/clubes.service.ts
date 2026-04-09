import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Jugador } from './jugadores.service';
import { environment } from '../../../environments/environment';

export interface Club {
  id: string;
  nombre: string;
  siglas: string;
  username?: string; // Opcional ahora
  logoUrl?: string;
  esInvitado: boolean; // Agregamos esta marca
  jugadores?: Jugador[];
}

@Injectable({
  providedIn: 'root',
})
export class ClubesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/clubes';

  getClubes(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/`);
  }
  updateClub(id: string, formData: FormData): Observable<Club> {
    return this.http.put<Club>(`${this.apiUrl}/${id}`, formData);
  }
  createClub(clubData: any): Observable<any> {
    return this.http.post(this.apiUrl, clubData);
  }
  deleteClub(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  crearClubInvitado(datos: { nombre: string; siglas: string }): Observable<Club> {
    return this.http.post<Club>(`${this.apiUrl}/invitado-rapido`, datos);
  }
  getAgendaClub(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${clubId}/agenda-completa`);
  }
}
