import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { toast } from 'ngx-sonner';
import { GaleriaService } from '../../../core/services/galeria.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-galeria-component',
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-galeria-component.html',
  styleUrl: './admin-galeria-component.css',
})
export class AdminGaleriaComponent {
  private galeriaService = inject(GaleriaService);
  private cdr = inject(ChangeDetectorRef);

  files: File[] = [];
  previews: string[] = [];
  titulo: string = '';
  categoria: string = 'General'; // Valor por defecto
  isUploading = false;

  // Lista de categorías para el select
  categoriasDisponibles = ['General', 'Torneo', 'Selección'];

  onFileSelected(event: any, input: HTMLInputElement) {
    const selectedFiles: FileList = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filesArray = Array.from(selectedFiles);

    filesArray.forEach((file: File) => {
      this.files.push(file);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        setTimeout(() => {
          this.previews = [...this.previews, e.target.result];
          this.cdr.detectChanges();
        });
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  subir() {
    if (this.files.length === 0) return;
    this.isUploading = true;

    const formData = new FormData();
    this.files.forEach((f) => formData.append('fotos', f));
    formData.append('titulo', this.titulo);
    formData.append('categoria', this.categoria); // ENVIAR CATEGORÍA AL BACKEND

    this.galeriaService.uploadFotos(formData).subscribe({
      next: () => {
        toast.success('Fotos publicadas correctamente');
        this.limpiar();
      },
      error: () => {
        toast.error('Error al subir las imágenes');
        this.isUploading = false;
      },
    });
  }

  limpiar() {
    this.files = [];
    this.previews = [];
    this.titulo = '';
    this.categoria = 'General';
    this.isUploading = false;
    this.cdr.detectChanges();
  }

  removePreview(index: number) {
    this.files.splice(index, 1);
    this.previews.splice(index, 1);
  }
}
