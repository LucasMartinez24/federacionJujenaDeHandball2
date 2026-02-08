import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Jugador {
  id: number;
  nombre: string;
  dni: string;
  categoria: string;
  anio: string;
  clubId: number;
}

@Injectable({
  providedIn: 'root',
})
export class JugadoresService {
  private jugadoresSubject = new BehaviorSubject<Jugador[]>([
    {
      id: 1,
      nombre: 'Lucas Martinez',
      dni: '44.769.386',
      categoria: 'Primera',
      anio: '2021',
      clubId: 1,
    },
    {
      id: 2,
      nombre: 'Rodrigo Calvetti',
      dni: '39.876.543',
      categoria: 'Primera',
      anio: '2019',
      clubId: 1,
    },
    {
      id: 3,
      nombre: 'Facundo Pardo',
      dni: '45.432.123',
      categoria: 'Juvenil',
      anio: '2023',
      clubId: 1,
    },
    {
      id: 4,
      nombre: 'Juan Perez',
      dni: '40.123.456',
      categoria: 'Primera',
      anio: '2020',
      clubId: 2,
    },
  ]);

  public jugadores$ = this.jugadoresSubject.asObservable();

  constructor() {
    this.loadJugadoresFromStorage();
  }

  getAllJugadores(): Jugador[] {
    return this.jugadoresSubject.value;
  }

  getJugadoresByClub(clubId: number): Jugador[] {
    return this.jugadoresSubject.value.filter((j) => j.clubId === clubId);
  }

  addJugador(jugador: Omit<Jugador, 'id'>): void {
    const jugadores = this.jugadoresSubject.value;
    const newJugador: Jugador = {
      ...jugador,
      id: Math.max(...jugadores.map((j) => j.id), 0) + 1,
    };
    this.jugadoresSubject.next([...jugadores, newJugador]);
    this.saveJugadoresFromStorage();
  }

  deleteJugador(id: number): void {
    const jugadores = this.jugadoresSubject.value.filter((j) => j.id !== id);
    this.jugadoresSubject.next(jugadores);
    this.saveJugadoresFromStorage();
  }

  updateJugador(id: number, jugador: Partial<Jugador>): void {
    const jugadores = this.jugadoresSubject.value.map((j) =>
      j.id === id ? { ...j, ...jugador } : j,
    );
    this.jugadoresSubject.next(jugadores);
    this.saveJugadoresFromStorage();
  }

  private saveJugadoresFromStorage(): void {
    localStorage.setItem('jugadores', JSON.stringify(this.jugadoresSubject.value));
  }

  private loadJugadoresFromStorage(): void {
    const jugadoresJson = localStorage.getItem('jugadores');
    if (jugadoresJson) {
      try {
        const jugadores = JSON.parse(jugadoresJson);
        this.jugadoresSubject.next(jugadores);
      } catch (e) {
        console.error('Error al cargar jugadores del storage', e);
      }
    }
  }
}
