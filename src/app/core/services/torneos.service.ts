import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TorneosService {
  private http = inject(HttpClient);
  private url = 'http://localhost:3000/api/torneos';

  getTorneos(): Observable<any[]> {
    return this.http.get<any[]>(this.url);
  }

  crearTorneo(data: any): Observable<any> {
    return this.http.post(this.url, data);
  }
  updateTorneo(id: string, data: any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, data);
  }
}
