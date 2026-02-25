import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-jugador-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './jugador-form.component.html',
  styleUrl: './jugador-form.component.css',
})
export class JugadorFormComponent implements OnInit {
  private auth = inject(AuthService);
  private jugadoresService = inject(JugadoresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Estado del formulario
  isEditMode: boolean = false;
  jugadorId: string | null = null;
  loading: boolean = false;
  errorMessage: string = '';

  // Datos del formulario
  jugadorData: any = {
    dni: '',
    apellidos: '',
    nombres: '',
    genero: 'Masculino',
    nacionalidad: 'Argentina',
    email: '',
    whatsapp: '',
    tutorPhone: '',
    peso: null,
    altura: null,
    tipoFicha: 'Jugador Activo',
    clubId: '',
  };

  birthDate: string = '';
  selectedCategory: string = '';
  isMinor: boolean = false;
  selectedHand: string = 'Derecha';
  clubNombre: string = '';

  fileNames = {
    certificado: '',
    dniFrontal: '',
  };

  ngOnInit() {
    // 1. Obtener ID del jugador si estamos en modo edición (desde la URL /jugador-form/:id)
    this.jugadorId = this.route.snapshot.paramMap.get('id');

    // 2. Leer parámetros de consulta (Query Params)
    this.route.queryParams.subscribe((params) => {
      if (params['clubId']) {
        this.jugadorData.clubId = params['clubId'];
        // Opcional: Podrías pedir al backend el nombre del club si no lo tienes
      }

      if (params['edit'] === 'true' && this.jugadorId) {
        this.isEditMode = true;
        this.cargarDatosJugador(this.jugadorId);
      }
    });

    // Si no viene clubId por param, intentamos el del usuario logueado
    if (!this.jugadorData.clubId) {
      this.jugadorData.clubId = this.auth.getId();
    }
    this.clubNombre = this.auth.getClubNombre() || 'Club Seleccionado';
  }

  cargarDatosJugador(id: string) {
    this.loading = true;
    // Buscamos en el Subject del servicio para no hacer otra petición HTTP innecesaria
    const jugador = this.jugadoresService.getAllJugadores().find((j) => j.id === id);

    if (jugador) {
      this.poblarFormulario(jugador);
      this.loading = false;
    } else {
      // Si no está en memoria, podrías implementar un getJugadorById en el servicio
      this.errorMessage = 'No se encontró la información del jugador.';
      this.loading = false;
    }
  }

  poblarFormulario(j: Jugador) {
    // Separar nombre y apellido si es posible
    const partesNombre = j.nombreCompleto.split(', ');

    this.jugadorData = {
      dni: j.dni,
      apellidos: partesNombre[0] || '',
      nombres: partesNombre[1] || j.nombreCompleto,
      genero: j.genero || 'Masculino',
      nacionalidad: j.nacionalidad || 'Argentina',
      email: j.email || '',
      whatsapp: j.whatsapp || '',
      tutorPhone: j.tutorPhone || '',
      peso: j.peso,
      altura: j.altura,
      tipoFicha: j.tipoFicha || 'Jugador Activo',
      clubId: j.clubId,
    };

    this.birthDate = j.fechaNacimiento.split('T')[0]; // Formatear fecha para el input date
    this.selectedHand = j.manoHabil || 'Derecha';
    this.onDateChange(this.birthDate);
  }

  get progress(): number {
    const fields = [
      this.jugadorData.dni,
      this.jugadorData.apellidos,
      this.jugadorData.nombres,
      this.birthDate,
      this.jugadorData.email,
    ];
    const completed = fields.filter((f) => !!f).length;
    return Math.round((completed / fields.length) * 100);
  }

  onFileChange(event: any, type: 'certificado' | 'dniFrontal') {
    const file = event.target.files[0];
    if (file) {
      this.fileNames[type] = file.name;
    }
  }

  onDateChange(newDate: string) {
    if (!newDate) return;
    const birth = new Date(newDate);
    const age = this.calculateAge(birth);
    this.isMinor = age < 18;

    if (age <= 12) this.selectedCategory = 'Infantiles (u12)';
    else if (age <= 14) this.selectedCategory = 'Menores (u14)';
    else if (age <= 16) this.selectedCategory = 'Cadetes (u16)';
    else if (age <= 18) this.selectedCategory = 'Juveniles (u18)';
    else this.selectedCategory = 'Primera';
  }

  private calculateAge(birth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  onHandChange(hand: string) {
    this.selectedHand = hand;
  }

  onFinalize() {
    this.errorMessage = '';

    if (!this.jugadorData.dni || !this.jugadorData.nombres || !this.birthDate) {
      this.errorMessage = 'Por favor, completa los campos obligatorios.';
      return;
    }

    this.loading = true;

    const payload = {
      ...this.jugadorData,
      nombreCompleto: `${this.jugadorData.apellidos}, ${this.jugadorData.nombres}`,
      fechaNacimiento: this.birthDate,
      categoria: this.selectedCategory,
      manoHabil: this.selectedHand,
    };

    const request =
      this.isEditMode && this.jugadorId
        ? this.jugadoresService.updateJugador(this.jugadorId, payload)
        : this.jugadoresService.addJugador(payload);

    request.subscribe({
      next: () => {
        this.loading = false;
        // Redirigir a la gestión de clubes si veníamos de ahí, o al dashboard
        window.history.back();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Ocurrió un error al procesar la solicitud.';
      },
    });
  }
}
