import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GaleriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/galeria`;

  getFotos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  uploadFotos(formData: FormData): Observable<any> {
    // Al enviar FormData, Angular configura automáticamente el Content-Type con el boundary
    return this.http.post(this.apiUrl, formData);
  }
  deleteFoto(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
