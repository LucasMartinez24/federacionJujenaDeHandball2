import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFacebook, faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { GaleriaService } from '../../../core/services/galeria.service';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-principal',
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './principal.html',
  styleUrl: './principal.css',
})
export class Principal implements OnInit {
  private galeriaService = inject(GaleriaService);
  readonly baseUrl = environment.serverUrl; // URL de tu VPS
  private cdr = inject(ChangeDetectorRef);

  faTiktok = faTiktok;
  faInstagram = faInstagram;
  faLogin = faSignInAlt;
  equipos = [
    { nombre: 'CIAF', logo: '/img/equipos/CIAF.png' },
    { nombre: 'Club Atletico Independencia', logo: '/img/equipos/CAI.jpg' },
    { nombre: 'C.S.D. Universitario 23 de agosto', logo: '/img/equipos/Unju.jpg' },
    { nombre: 'Club Sportivo Rivadavia', logo: '/img/equipos/Rivadavia.png' },
    { nombre: 'Minas Handball', logo: '/img/equipos/minasHandball.png' },
    { nombre: 'Vida en Accion', logo: '/img/equipos/VEA.png' },
  ];
  ultimasFotos: any[] = [];

  ngOnInit() {
    this.cargarUltimasFotos();
  }

  cargarUltimasFotos() {
    this.galeriaService.getFotos().subscribe({
      next: (res: any) => {
        // Aseguramos obtener el array correcto y cortamos los últimos 3
        const fotos = res.fotos || res;
        this.ultimasFotos = fotos.slice(0, 3);

        // FORZAMOS LA DETECCIÓN PARA QUE LAS IMÁGENES APAREZCAN
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando destacados', err),
    });
  }
}
