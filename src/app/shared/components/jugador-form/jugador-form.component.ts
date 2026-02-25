import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';
import { ClubesService } from '../../../core/services/clubes.service'; // Inyectar para buscar el nombre
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
  private clubesService = inject(ClubesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  isEditMode: boolean = false;
  jugadorId: string | null = null;
  loading: boolean = false;
  errorMessage: string = '';

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
    clubId: '', // Este es el que enviaremos al backend
  };

  birthDate: string = '';
  selectedCategory: string = '';
  isMinor: boolean = false;
  selectedHand: string = 'Derecha';
  clubNombre: string = 'Cargando club...'; // Para mostrar en el input readonly

  fileNames = { certificado: '', dniFrontal: '' };

  ngOnInit() {
    this.jugadorId = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe((params) => {
      // 1. CAPTURAR EL CLUB DESDE LA URL (GESTIÓN DE CLUBES)
      if (params['clubId']) {
        this.jugadorData.clubId = params['clubId'];
        this.buscarNombreClub(params['clubId']);
      }

      // 2. MODO EDICIÓN
      if (params['edit'] === 'true' && this.jugadorId) {
        this.isEditMode = true;
        this.cargarDatosJugador(this.jugadorId);
      }
    });

    // 3. SI NO HAY CLUB EN URL, USAR EL DEL USUARIO (CASO LOGIN CLUB)
    if (!this.jugadorData.clubId) {
      this.jugadorData.clubId = this.auth.getId();
      this.clubNombre = this.auth.getClubNombre() || 'Mi Club';
    }

    this.cdr.detectChanges();
  }

  buscarNombreClub(id: string) {
    // Buscamos en la lista de clubes que ya debería estar en el servicio de clubes
    this.clubesService.getClubes().subscribe((clubes) => {
      const club = clubes.find((c) => c.id === id);
      if (club) {
        this.clubNombre = club.nombre;
        this.cdr.detectChanges();
      }
    });
  }

  cargarDatosJugador(id: string) {
    this.loading = true;
    const jugador = this.jugadoresService.getAllJugadores().find((j) => j.id === id);

    if (jugador) {
      this.poblarFormulario(jugador);
      this.loading = false;
    } else {
      this.errorMessage = 'No se encontró la información del jugador.';
      this.loading = false;
    }
    this.cdr.detectChanges();
  }

  poblarFormulario(j: Jugador) {
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
      clubId: j.clubId, // Mantenemos el club original
    };

    this.birthDate = j.fechaNacimiento.split('T')[0];
    this.selectedHand = j.manoHabil || 'Derecha';
    this.onDateChange(this.birthDate);
    this.buscarNombreClub(j.clubId); // Actualizar nombre en edición
  }

  // --- MÉTODOS DE APOYO ---

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
    this.cdr.detectChanges();
  }

  onFinalize() {
    this.errorMessage = '';
    if (!this.jugadorData.dni || !this.jugadorData.nombres || !this.birthDate) {
      this.errorMessage = 'Por favor, completa los campos obligatorios.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;

    // EL PAYLOAD USA EL clubId FILTRADO (EL DEL CLUB SELECCIONADO)
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
        // Volver atrás para mantener el club seleccionado en la lista
        window.history.back();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Error al procesar la solicitud.';
        this.cdr.detectChanges();
      },
    });
  }

  private calculateAge(birth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  onFileChange(event: any, type: 'certificado' | 'dniFrontal') {
    const file = event.target.files[0];
    if (file) {
      this.fileNames[type] = file.name;
      this.cdr.detectChanges();
    }
  }

  onHandChange(hand: string) {
    this.selectedHand = hand;
    this.cdr.detectChanges();
  }
}
