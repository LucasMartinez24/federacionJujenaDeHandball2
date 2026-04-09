import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupportService {
  private http = inject(HttpClient);
  private readonly URL = environment.apiUrl + '/tickets';

  getTickets(): Observable<any[]> {
    return this.http.get<any[]>(this.URL);
  }

  getMessages(ticketId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/${ticketId}/messages`);
  }

  sendReply(ticketId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.URL}/${ticketId}/reply`, formData);
  }

  updateStatus(ticketId: string, status: string): Observable<any> {
    return this.http.patch(`${this.URL}/${ticketId}/status`, { status });
  }
  getServerUrl(): string {
    return environment.apiUrl.replace('/api', '');
  }
  // Obtener tickets del club logueado
  getTicketsDelClub(clubId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}?clubId=${clubId}`);
  }

  // Crear un ticket nuevo (con archivos)
  crearTicket(formData: FormData): Observable<any> {
    return this.http.post(this.URL, formData);
  }

  // Obtener mensajes de un ticket específico
  getMensajes(ticketId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL}/${ticketId}/messages`);
  }

  // Responder a un ticket existente
  enviarRespuesta(ticketId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.URL}/${ticketId}/reply`, formData);
  }
}
