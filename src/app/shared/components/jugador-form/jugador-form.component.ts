import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { JugadoresService } from '../../../core/services/jugadores.service';
import { ClubesService } from '../../../core/services/clubes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';

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

  windowWidth = window.innerWidth;

  @HostListener('window:resize')
  onResize() {
    this.windowWidth = window.innerWidth;
  }

  isEditMode: boolean = false;
  jugadorId: string | null = null;
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
    estado: 'Pendiente',
    clubId: '',
  };

  birthDate: string = '';
  selectedCategory: string = '';
  isMinor: boolean = false;
  selectedHand: string = 'Derecha';
  clubNombre: string = 'Cargando club...';

  // Manejo de archivos y previsualización (Agregado fichaJugador)
  fileNames = {
    fichaMedica: '',
    autorizacionPadres: '',
    fichaJugador: '',
  };

  files = {
    fichaMedica: null as File | null,
    autorizacionPadres: null as File | null,
    fichaJugador: null as File | null,
  };

  urlsExistentes = {
    fichaMedica: '',
    autorizacionPadres: '',
    fichaJugador: '',
  };

  ngOnInit() {
    this.jugadorId = this.route.snapshot.paramMap.get('id');

    this.route.queryParams.subscribe((params) => {
      if (params['clubId']) {
        this.jugadorData.clubId = params['clubId'];
        this.buscarNombreClub(params['clubId']);
      }

      if (params['edit'] === 'true' && this.jugadorId) {
        this.isEditMode = true;
        this.cargarDatosJugador(this.jugadorId);
      }
    });

    if (!this.jugadorData.clubId) {
      this.jugadorData.clubId = this.auth.getId();
      this.clubNombre = this.auth.getClubNombre() || 'Mi Club';
    }

    this.cdr.detectChanges();
  }

  buscarNombreClub(id: string) {
    this.clubesService.getClubes().subscribe((clubes) => {
      const club = clubes.find((c) => c.id === id);
      if (club) {
        this.clubNombre = club.nombre;
        this.cdr.detectChanges();
      }
    });
  }

  cargarDatosJugador(id: string) {
    this.jugadoresService.getJugadorById(id).subscribe({
      next: (jugador) => {
        if (jugador) {
          this.poblarFormulario(jugador);
        } else {
          this.errorMessage = 'El servidor no devolvió datos para este jugador.';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar jugador:', err);
        this.errorMessage = 'Error al conectar con el servidor.';
        this.cdr.detectChanges();
      },
    });
  }

  poblarFormulario(j: any) {
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
      estado: j.estado || 'Pendiente',
      clubId: j.clubId,
    };

    this.birthDate = j.fechaNacimiento.split('T')[0];
    this.selectedHand = j.manoHabil || 'Derecha';
    this.onDateChange(this.birthDate);
    this.buscarNombreClub(j.clubId);

    // RECONOCER ARCHIVOS EXISTENTES
    if (j.fichaMedicaUrl) {
      this.fileNames.fichaMedica = 'Archivo guardado';
      this.urlsExistentes.fichaMedica = j.fichaMedicaUrl;
    }
    if (j.autorizacionUrl) {
      this.fileNames.autorizacionPadres = 'Archivo guardado';
      this.urlsExistentes.autorizacionPadres = j.autorizacionUrl;
    }
    if (j.fichaJugadorUrl) {
      this.fileNames.fichaJugador = 'Archivo guardado';
      this.urlsExistentes.fichaJugador = j.fichaJugadorUrl;
    }

    this.cdr.detectChanges();
  }

  verArchivo(tipo: 'fichaMedica' | 'autorizacionPadres' | 'fichaJugador') {
    const url = this.urlsExistentes[tipo];
    if (url) {
      // Ajusta según tu URL de API (localhost:3000 o producción)
      window.open(`http://localhost:3000${url}`, '_blank');
    }
  }

  get progress(): number {
    const fields = [
      this.jugadorData.dni,
      this.jugadorData.apellidos,
      this.jugadorData.nombres,
      this.birthDate,
      this.fileNames.fichaMedica,
      this.fileNames.fichaJugador, // Campo obligatorio
    ];

    if (this.isMinor) {
      fields.push(this.fileNames.autorizacionPadres);
    }

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

  onFileChange(event: any, type: 'fichaMedica' | 'autorizacionPadres' | 'fichaJugador') {
    const file = event.target.files[0];
    if (file) {
      this.fileNames[type] = file.name;
      this.files[type] = file;
      this.cdr.detectChanges();
    }
  }

  onFinalize() {
    this.errorMessage = '';

    // Validaciones de archivos obligatorios
    if (!this.fileNames.fichaMedica) {
      this.errorMessage = 'La Ficha Médica es obligatoria.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.fileNames.fichaJugador) {
      this.errorMessage = 'La Ficha de Jugador (Fichaje FJH) es obligatoria.';
      this.cdr.detectChanges();
      return;
    }

    if (this.isMinor && !this.fileNames.autorizacionPadres) {
      this.errorMessage = 'Los menores requieren Autorización de Padres.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.jugadorData.dni || !this.jugadorData.nombres || !this.birthDate) {
      this.errorMessage = 'Completa los datos personales obligatorios.';
      this.cdr.detectChanges();
      return;
    }

    const formData = new FormData();
    Object.keys(this.jugadorData).forEach((key) => {
      if (this.jugadorData[key] !== null) {
        formData.append(key, this.jugadorData[key]);
      }
    });

    formData.append('nombreCompleto', `${this.jugadorData.apellidos}, ${this.jugadorData.nombres}`);
    formData.append('fechaNacimiento', this.birthDate);
    formData.append('categoria', this.selectedCategory);
    formData.append('manoHabil', this.selectedHand);

    // Adjuntar archivos al FormData
    if (this.files.fichaMedica) formData.append('fichaMedica', this.files.fichaMedica);
    if (this.files.fichaJugador) formData.append('fichaJugador', this.files.fichaJugador);
    if (this.isMinor && this.files.autorizacionPadres) {
      formData.append('autorizacionPadres', this.files.autorizacionPadres);
    }

    const request =
      this.isEditMode && this.jugadorId
        ? this.jugadoresService.updateJugador(this.jugadorId, formData as any)
        : this.jugadoresService.addJugador(formData as any);

    request.subscribe({
      next: () => {
        toast.success(this.isEditMode ? 'Jugador actualizado' : 'Inscripción finalizada con éxito');
        window.history.back();
      },
      error: (err) => {
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

  onHandChange(hand: string) {
    this.selectedHand = hand;
    this.cdr.detectChanges();
  }
}
