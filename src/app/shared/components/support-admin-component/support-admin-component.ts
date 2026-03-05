import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-support-admin-component',
  imports: [CommonModule, FormsModule],
  templateUrl: './support-admin-component.html',
  styleUrl: './support-admin-component.css',
})
export class SupportAdminComponent {
  replyText: string = '';
  isInternal: boolean = false;
  selectedFiles: File[] = [];

  // Mock de datos para la Federación
  activeTicket = {
    id: '#4592',
    club: 'Club ficticio',
    subject: 'Problemas de registro',
    status: 'Abierto',
  };

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.push(...files);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  sendReply() {
    if (!this.replyText && this.selectedFiles.length === 0) return;

    // Aquí iría la lógica del FormData para enviar al backend de Node.js
    console.log('Enviando:', {
      text: this.replyText,
      internal: this.isInternal,
      files: this.selectedFiles,
    });

    // Resetear form
    this.replyText = '';
    this.selectedFiles = [];
    this.isInternal = false;
  }
}
