import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

// Definición de roles basada en la nueva estructura de la Federación
export type UserRole =
  | 'admin'
  | 'REP_FEDERACION'
  | 'OFICIAL_MESA'
  | 'JEFE_ARBITROS'
  | 'CM'
  | 'user';

export interface User {
  id: string;
  username: string;
  nombre: string;
  role: UserRole;
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
  private apiUrl = environment.apiUrl + '/auth';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        // Guardamos el token y los datos del usuario en el almacenamiento local
        localStorage.setItem('token', res.token);
        localStorage.setItem('currentUser', JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      }),
      map((res) => res.user),
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // --- MÉTODOS DE AUTENTICACIÓN ---

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // --- MÉTODOS DE PERMISOS POR ROL ---

  /**
   * Super Admin: Control total del sistema
   */
  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  /**
   * Representante de Federación: Puede ver clubes y aprobar jugadores
   */
  isRepFederacion(): boolean {
    return this.getCurrentUser()?.role === 'REP_FEDERACION';
  }
  isCM(): boolean {
    return this.getCurrentUser()?.role === 'CM';
  }
  /**
   * Oficial de Mesa: Encargado de subir Match Reports y resultados
   */
  isOficialMesa(): boolean {
    return this.getCurrentUser()?.role === 'OFICIAL_MESA';
  }

  /**
   * Jefe de Árbitros: Gestión de designaciones y visualización de torneos
   */
  isJefeArbitros(): boolean {
    return this.getCurrentUser()?.role === 'JEFE_ARBITROS';
  }

  /**
   * Club (Usuario normal): Gestión de su propia plantilla y tickets
   */
  isClub(): boolean {
    return this.getCurrentUser()?.role === 'user';
  }

  // --- MÉTODOS DE ACCESO COMBINADO ---

  /**
   * Determina quién puede entrar al Audit de Plantilla y Clubes
   */
  canManageClubs(): boolean {
    const role = this.getCurrentUser()?.role;
    return role === 'admin' || role === 'REP_FEDERACION';
  }

  /**
   * Determina quién puede gestionar o ver el apartado de torneos
   */
  canAccessTorneos(): boolean {
    const role = this.getCurrentUser()?.role;
    // Todos los roles de Staff + el Admin pueden ver torneos
    return ['admin', 'REP_FEDERACION', 'OFICIAL_MESA', 'JEFE_ARBITROS'].includes(role || '');
  }

  // --- HELPERS DE DATOS ---

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
}
