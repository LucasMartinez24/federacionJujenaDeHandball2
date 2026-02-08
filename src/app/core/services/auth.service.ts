import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  clubId?: number;
  clubNombre?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Usuarios predefinidos con clubes asignados
  private users: { username: string; password: string; user: User }[] = [
    {
      username: 'admin',
      password: 'admin123',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@handball.com',
        role: 'admin',
      },
    },
    {
      username: 'ciaf',
      password: 'ciaf123',
      user: {
        id: 2,
        username: 'ciaf',
        email: 'ciaf@handball.com',
        role: 'user',
        clubId: 1,
        clubNombre: 'CIAF',
      },
    },
    {
      username: 'minasHandball',
      password: 'minasHandball123',
      user: {
        id: 3,
        username: 'minasHandball',
        email: 'minasHandball@handball.com',
        role: 'user',
        clubId: 2,
        clubNombre: 'Minas Handball',
      },
    },
  ];

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginCredentials): Observable<User | null> {
    return new Observable((observer) => {
      const user = this.users.find(
        (u) => u.username === credentials.username && u.password === credentials.password,
      );

      if (user) {
        this.currentUserSubject.next(user.user);
        localStorage.setItem('currentUser', JSON.stringify(user.user));
        observer.next(user.user);
      } else {
        observer.error('Usuario o contraseña incorrectos');
      }
      observer.complete();
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  getClubId(): number | undefined {
    return this.currentUserSubject.value?.clubId;
  }

  getClubNombre(): string | undefined {
    return this.currentUserSubject.value?.clubNombre;
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error al cargar usuario del storage', e);
      }
    }
  }
}
