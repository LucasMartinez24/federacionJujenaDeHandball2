import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

export interface User {
  id: string;
  username: string;
  nombre: string;
  role: 'admin' | 'user'; // <--- Debe llamarse igual
  siglas?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        // Guardamos los datos físicamente
        localStorage.setItem('token', res.token);
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }),
      // AQUÍ ESTÁ LA CLAVE:
      // Transformamos la respuesta para que el componente reciba solo res.user
      map((res) => res.user),
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // Los métodos auxiliares se mantienen igual de útiles
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  getClubNombre(): string | null {
    return this.getCurrentUser()?.username ?? null;
  }
  getId(): string | null {
    return this.getCurrentUser()?.id ?? null;
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    if (userJson && token) {
      this.currentUserSubject.next(JSON.parse(userJson));
    }
  }
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
