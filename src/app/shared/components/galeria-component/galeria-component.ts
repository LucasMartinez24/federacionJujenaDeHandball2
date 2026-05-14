import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { GaleriaService } from '../../../core/services/galeria.service';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { faImage, faTrash } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'ngx-sonner';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-galeria-component',
  imports: [CommonModule, RouterLink],
  templateUrl: './galeria-component.html',
  styleUrl: './galeria-component.css',
})
export class GaleriaComponent implements OnInit {
  private galeriaService = inject(GaleriaService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  readonly baseUrl = environment.serverUrl; // Para completar la URL de la imagen
  faImage = faImage;
  fotos: any[] = [];
  fotosFiltradas: any[] = [];
  categorias: string[] = ['Todas', 'Torneo', 'Selección'];
  categoriaActual: string = 'Todas';

  faTrash = faTrash;
  userRole: string | null = null;

  ngOnInit() {
    this.cargarGaleria();
    this.userRole = this.authService.getCurrentUser()?.role ?? null;
  }

  // Nueva función para eliminar
  eliminarFoto(id: string) {
    this.galeriaService.deleteFoto(id).subscribe({
      next: () => {
        // 1. Filtramos el array principal de 'fotos'
        this.fotos = this.fotos.filter((f) => f.id !== id);

        // 2. IMPORTANTE: Volvemos a aplicar el filtro actual para actualizar 'fotosFiltradas'
        // Si no haces esto, 'fotosFiltradas' sigue teniendo la foto vieja
        if (this.categoriaActual === 'Todas') {
          this.fotosFiltradas = [...this.fotos];
        } else {
          this.fotosFiltradas = this.fotos.filter((f) => f.categoria === this.categoriaActual);
        }

        // 3. Forzamos a Angular a que renderice de nuevo
        this.cdr.detectChanges();

        toast.success('La imagen ha sido eliminada del servidor');
      },
      error: (err) => {
        console.error(err);
        toast.error('Error al intentar eliminar el archivo');
      },
    });
  }

  cargarGaleria() {
    this.galeriaService.getFotos().subscribe({
      next: (res: any) => {
        // AJUSTE AQUÍ: Si el backend envía el objeto paginado, accedemos a .fotos
        // Si no usas paginación todavía, asegúrate de que 'res' sea el array
        this.fotos = res.fotos || res;
        this.fotosFiltradas = this.fotos;
        this.cdr.detectChanges(); // Importante para asegurar que se pinte
      },
      error: (err) => {
        console.error('Error cargando fotos', err);
        this.fotos = [];
        this.fotosFiltradas = [];
      },
    });
  }

  filtrar(cat: string) {
    this.categoriaActual = cat;
    if (cat === 'Todas') {
      this.fotosFiltradas = this.fotos;
    } else {
      this.fotosFiltradas = this.fotos.filter((f) => f.categoria === cat);
    }
  }
}
