import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Jugador } from './jugadores.service';

export interface Club {
  id: string;
  nombre: string;
  siglas: string;
  username: string;
  jugadores?: Jugador[];
}

@Injectable({
  providedIn: 'root',
})
export class ClubesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/clubes';

  getClubes(): Observable<Club[]> {
    return this.http.get<Club[]>(`${this.apiUrl}/`);
  }

  createClub(clubData: any): Observable<any> {
    return this.http.post(this.apiUrl, clubData);
  }
}
