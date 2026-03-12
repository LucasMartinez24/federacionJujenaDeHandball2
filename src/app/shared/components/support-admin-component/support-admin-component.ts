import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupportService } from '../../../core/services/support.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-support-admin-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './support-admin-component.html',
  styleUrl: './support-admin-component.css',
})
export class SupportAdminComponent implements OnInit {
  private supportService = inject(SupportService);
  private cdr = inject(ChangeDetectorRef);

  tickets: any[] = [];
  messages: any[] = [];
  activeTicket: any = null;

  replyText: string = '';
  isInternal: boolean = false;
  selectedFiles: File[] = [];
  loadingMessages: boolean = false;

  ngOnInit() {
    this.cargarTickets();
  }

  cargarTickets() {
    this.supportService.getTickets().subscribe((data) => {
      this.tickets = data;
      if (this.tickets.length > 0) this.seleccionarTicket(this.tickets[0]);
      this.cdr.detectChanges();
    });
  }

  seleccionarTicket(ticket: any) {
    this.activeTicket = ticket;
    this.loadingMessages = true;
    this.supportService.getMessages(ticket.id).subscribe((msgs) => {
      this.messages = msgs;
      this.loadingMessages = false;
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

  cambiarEstado() {
    this.supportService
      .updateStatus(this.activeTicket.id, this.activeTicket.status)
      .subscribe(() => {
        toast.success('Estado actualizado');
      });
  }

  sendReply() {
    if (!this.replyText.trim() && this.selectedFiles.length === 0) return;

    const formData = new FormData();
    formData.append('message', this.replyText);
    formData.append('isInternal', String(this.isInternal));
    this.selectedFiles.forEach((file) => formData.append('attachments', file));

    this.supportService.sendReply(this.activeTicket.id, formData).subscribe({
      next: (newMessage) => {
        this.messages.push(newMessage);
        this.replyText = '';
        this.selectedFiles = [];
        toast.success(this.isInternal ? 'Nota guardada' : 'Respuesta enviada');
        this.cdr.detectChanges();
      },
      error: () => toast.error('Error al enviar mensaje'),
    });
  }

  getAttachmentUrl(url: string) {
    if (!url) return null;

    // Obtenemos la base (http://localhost:3000 en local o "" en prod)
    const baseUrl = this.supportService.getServerUrl();

    return `${baseUrl}${url}`;
  }
}
