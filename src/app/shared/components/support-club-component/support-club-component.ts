import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { SupportService } from '../../../core/services/support.service';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-support-club-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './support-club-component.html',
  styleUrl: './support-club-component.css',
})
export class SupportClubComponent implements OnInit {
  private supportService = inject(SupportService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // Estados de UI
  showModal = false;
  loading = false;
  loadingChat = false;

  // Datos
  tickets: any[] = [];
  ticketSeleccionado: any = null;
  mensajes: any[] = [];

  // Forms
  nuevoTicket = { asunto: '', categoria: 'General', descripcion: '' };
  respuestaRapida: string = '';
  selectedFiles: File[] = [];

  ngOnInit() {
    this.cargarTickets();
  }

  cargarTickets() {
    const clubId = this.auth.getId();
    if (!clubId) {
      toast.error('No se pudo obtener el ID del club');
      return;
    }
    this.supportService.getTicketsDelClub(clubId).subscribe((data) => {
      this.tickets = data;
      this.cdr.detectChanges();
    });
  }

  seleccionarTicket(ticket: any) {
    this.ticketSeleccionado = ticket;
    this.loadingChat = true;
    this.supportService.getMensajes(ticket.id).subscribe((msgs) => {
      this.mensajes = msgs;
      this.loadingChat = false;
      this.cdr.detectChanges();
    });
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  enviarTicket() {
    if (!this.nuevoTicket.asunto || !this.nuevoTicket.descripcion) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const clubId = this.auth.getId();
    if (!clubId) {
      toast.error('No se pudo obtener el ID del club');
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('asunto', this.nuevoTicket.asunto);
    formData.append('categoria', this.nuevoTicket.categoria);
    formData.append('descripcion', this.nuevoTicket.descripcion);
    formData.append('clubId', clubId);
    this.selectedFiles.forEach((f) => formData.append('attachments', f));

    this.supportService.crearTicket(formData).subscribe({
      next: (ticket) => {
        toast.success('Ticket creado correctamente');
        this.tickets.unshift(ticket);
        this.cerrarModal();
        this.loading = false;
      },
      error: () => {
        toast.error('Error al enviar ticket');
        this.loading = false;
      },
    });
  }

  enviarRespuesta() {
    if (!this.respuestaRapida.trim() && this.selectedFiles.length === 0) return;

    const formData = new FormData();
    formData.append('message', this.respuestaRapida);
    this.selectedFiles.forEach((f) => formData.append('attachments', f));

    this.supportService
      .enviarRespuesta(this.ticketSeleccionado.id, formData)
      .subscribe((newMsg) => {
        this.mensajes.push(newMsg);
        this.respuestaRapida = '';
        this.selectedFiles = [];
        this.cdr.detectChanges();
      });
  }

  cerrarModal() {
    this.showModal = false;
    this.nuevoTicket = { asunto: '', categoria: 'General', descripcion: '' };
    this.selectedFiles = [];
  }

  abrirModal() {
    this.showModal = true;
  }
}
