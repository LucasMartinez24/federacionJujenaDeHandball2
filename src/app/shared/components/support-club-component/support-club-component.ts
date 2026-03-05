import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
@Component({
  selector: 'app-support-club-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './support-club-component.html',
  styleUrl: './support-club-component.css',
})
export class SupportClubComponent {
  private cdr = inject(ChangeDetectorRef);

  showModal = false;
  loading = false;

  // Datos para el nuevo ticket
  nuevoTicket = {
    asunto: '',
    categoria: 'General',
    descripcion: '',
  };

  selectedFiles: File[] = [];

  // Mock de tickets del club
  tickets: any[] = [
    {
      id: 'TK-8821',
      asunto: 'Fallo carga planilla',
      categoria: 'Competencias',
      estado: 'In Progress',
      fecha: 'Hace 2h',
      archivos: 2,
    },
    {
      id: 'TK-8815',
      asunto: 'Verificación de Pago',
      categoria: 'Tesorería',
      estado: 'Pending',
      fecha: 'Ayer',
      archivos: 0,
    },
    {
      id: 'TK-8790',
      asunto: 'Pase Jugador Pérez',
      categoria: 'Fichajes',
      estado: 'Resolved',
      fecha: '24 Oct',
      archivos: 1,
    },
  ];

  ngOnInit() {}

  abrirModal() {
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.resetForm();
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.push(...files);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  resetForm() {
    this.nuevoTicket = { asunto: '', categoria: 'General', descripcion: '' };
    this.selectedFiles = [];
  }

  enviarTicket() {
    if (!this.nuevoTicket.asunto || !this.nuevoTicket.descripcion) {
      toast.error('Por favor, completa los campos obligatorios');
      return;
    }

    this.loading = true;

    // Simulación de envío con FormData
    const formData = new FormData();
    formData.append('asunto', this.nuevoTicket.asunto);
    formData.append('categoria', this.nuevoTicket.categoria);
    formData.append('descripcion', this.nuevoTicket.descripcion);
    this.selectedFiles.forEach((file) => formData.append('attachments', file));

    console.log('Enviando ticket a la Federación...');

    setTimeout(() => {
      toast.success('Ticket enviado correctamente. La Federación te responderá pronto.');
      this.loading = false;
      this.cerrarModal();
      this.cdr.detectChanges();
    }, 1500);
  }
}
