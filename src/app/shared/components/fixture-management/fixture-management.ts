import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PartidosService } from '../../../core/services/partido.service';
import { TorneosService } from '../../../core/services/torneos.service';
import { toast } from 'ngx-sonner';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
@Component({
  selector: 'app-fixture-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './fixture-management.html',
  styleUrl: './fixture-management.css',
})
export class FixtureManagement implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private partidosService = inject(PartidosService);
  private torneosService = inject(TorneosService);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService); // <--- Inyectamos el AuthService para verificar el rol del usuario
  torneoId: string | null = null;
  torneoNombre: string = 'Cargando torneo...';

  jornadasIds: number[] = []; // [1, 2, 3, 4...]
  jornadaSeleccionada: number = 1;
  partidos: any[] = [];
  loading: boolean = false;

  tablaPosiciones: any[] = [];
  mostrarTabla = false; // Para alternar entre Fixture y Tabla

  ngOnInit() {
    this.torneoId = this.route.snapshot.paramMap.get('id');
    this.esAdmin = this.authService.isAdmin(); // Verificar si el usuario es admin
    if (this.torneoId) {
      this.cargarDetallesTorneo();
      this.cargarFixture(1);
      this.cargarTabla(); // <--- Cargar tabla al iniciar
    }
  }
  esAdmin: boolean = false; // Variable para controlar la visibilidad de la tabla
  cargarTabla() {
    // Asumiendo que creaste el servicio en TorneosService o PartidosService
    this.partidosService.getTablaPosiciones(this.torneoId!).subscribe((data) => {
      this.tablaPosiciones = data;
      this.cdr.detectChanges();
    });
  }
  // Variables nuevas
  showDeleteModal = false;

  // Método para abrir el modal
  confirmarEliminacion() {
    this.showDeleteModal = true;
  }

  // Método para ejecutar el borrado
  eliminarTorneo() {
    if (!this.torneoId) return;

    this.torneosService.deleteTorneo(this.torneoId).subscribe({
      next: () => {
        toast.success('Torneo eliminado permanentemente');
        this.router.navigate(['/torneos']); // Redirigir a la lista general
      },
      error: (err) => {
        console.error(err);
        toast.error('No se pudo eliminar el torneo. Verifique si tiene partidos vinculados.');
      },
    });
  }
  cargarDetallesTorneo() {
    this.torneosService.getTorneoById(this.torneoId!).subscribe((t) => {
      this.torneoNombre = t.nombre;
      // Generamos el array de fechas basado en los partidos que existen
      this.partidosService.getJornadasDisponibles(this.torneoId!).subscribe((ids) => {
        this.jornadasIds = ids;
        this.cdr.detectChanges();
      });
    });
  }

  cargarFixture(numeroJornada: number) {
    this.loading = true;
    this.jornadaSeleccionada = numeroJornada;
    this.partidosService.getPartidosByJornada(this.torneoId!, numeroJornada).subscribe({
      next: (data) => {
        this.partidos = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        toast.error('Error al cargar los partidos');
        this.loading = false;
      },
    });
  }

  getLogo(url: string) {
    return url ? `http://localhost:3000${url}` : null;
  }

  showScoreModal = false;
  partidoSeleccionado: any = null;
  gLocal: number = 0;
  gVisitante: number = 0;

  cargarResultados(partido: any) {
    this.partidoSeleccionado = partido;
    this.gLocal = partido.golesLocal || 0;
    this.gVisitante = partido.golesVisitante || 0;
    this.showScoreModal = true;
  }

  soloNumerosPositivos(event: any): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 45) {
      // Código de la tecla "-"
      return false;
    }
    return true;
  }

  passwordAdmin: string = '';
  // Nota: En una app real, esta contraseña se validaría contra el backend o el JWT
  PASS_ADMIN_SECRETA = 'admin123'; // Define aquí tu clave temporal

  confirmarResultado() {
    // 1. Verificación de Goles Negativos
    if (this.gLocal < 0 || this.gVisitante < 0) {
      toast.error('Los goles no pueden ser números negativos');
      return;
    }

    // 2. Verificación de Contraseña de Administrador
    if (this.passwordAdmin !== this.PASS_ADMIN_SECRETA) {
      toast.error('Contraseña de administrador incorrecta');
      this.passwordAdmin = ''; // Limpiamos el intento fallido
      return;
    }

    const data = {
      golesLocal: this.gLocal,
      golesVisitante: this.gVisitante,
    };

    this.partidosService.updateResultado(this.partidoSeleccionado.id, data).subscribe({
      next: () => {
        toast.success('Resultado oficializado y tabla actualizada');

        // 3. Desactivar y limpiar el modal
        this.showScoreModal = false;
        this.passwordAdmin = '';

        this.cargarFixture(this.jornadaSeleccionada);
        this.cargarTabla();
      },
      error: () => toast.error('Error al procesar los puntos'),
    });
  }
}
