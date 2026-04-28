import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Jugador {
  id: string;
  dni: string;
  nombreCompleto: string;
  fechaNacimiento: string;
  clubId: string;
  fichaMedicaUrl: string;
  // Campos nuevos
  genero?: string;
  nacionalidad?: string;
  email?: string;
  whatsapp?: string;
  tutorPhone?: string;
  peso?: number | null;
  altura?: number | null;
  manoHabil?: string;
  estado?: string;
  categoria?: string;
  anio?: string; // Cambiamos a string si así lo tenías antes, o number si prefieres
}

@Injectable({
  providedIn: 'root',
})
export class JugadoresService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/jugadores';
  private jugadoresSubject = new BehaviorSubject<Jugador[]>([]);
  jugadores$ = this.jugadoresSubject.asObservable();

  // Obtener todos los jugadores del club logueado
  // (El backend filtra por club usando el Token de Auth)
  getJugadores(clubId?: string): Observable<Jugador[]> {
    // Si tu API filtra por clubId en la URL: `${this.apiUrl}?clubId=${clubId}`
    // Si el backend ya sabe quién es el club por el TOKEN, solo usa this.apiUrl
    const url = clubId ? `${this.apiUrl}?clubId=${clubId}` : this.apiUrl;

    return this.http.get<Jugador[]>(url).pipe(
      tap((jugadores) => {
        // Esto es lo que hace que el Dashboard se entere de los cambios
        this.jugadoresSubject.next(jugadores);
      }),
    );
  }
  cambiarEstado(id: string, estado: string): Observable<Jugador> {
    // Usamos PATCH y la ruta específica que definimos en el backend
    return this.http.patch<Jugador>(`${this.apiUrl}/${id}/estado`, { estado }).pipe(
      tap((jugadorActualizado) => {
        const actuales = this.jugadoresSubject.value;
        this.jugadoresSubject.next(actuales.map((j) => (j.id === id ? jugadorActualizado : j)));
      }),
    );
  }
  // Corregimos el tap del delete
  deleteJugador(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentJugadores = this.jugadoresSubject.value;
        this.jugadoresSubject.next(currentJugadores.filter((jugador) => jugador.id !== id));
      }),
    );
  }

  // Corregimos el tap del update
  updateJugador(id: string, jugador: Partial<Jugador>): Observable<Jugador> {
    return this.http.put<Jugador>(`${this.apiUrl}/${id}`, jugador).pipe(
      tap((jugadorActualizado) => {
        this.jugadoresSubject.next(
          this.jugadoresSubject.value.map(
            (item) => (item.id === id ? jugadorActualizado : item), // Comparación de strings
          ),
        );
      }),
    );
  }

  getAllJugadores(): Jugador[] {
    return this.jugadoresSubject.value;
  }

  // Agregar un jugador
  addJugador(jugador: Omit<Jugador, 'id'>): Observable<Jugador> {
    return this.http.post<Jugador>(this.apiUrl, jugador).pipe(
      tap((nuevoJugador) => {
        this.jugadoresSubject.next([...this.jugadoresSubject.value, nuevoJugador]);
      }),
    );
  }
  // En jugadores.service.ts
  getJugadorById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
}
