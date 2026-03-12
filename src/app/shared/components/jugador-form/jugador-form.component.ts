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
  @HostListener('window:resize') onResize() {
    this.windowWidth = window.innerWidth;
  }

  isEditMode = false;
  jugadorId: string | null = null;
  errorMessage = '';

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

  birthDate = '';
  selectedCategory = '';
  isMinor = false;
  selectedHand = 'Derecha';
  clubNombre = 'Cargando club...';

  fileNames = { fichaMedica: '', autorizacionPadres: '', fichaJugador: '' };
  files = {
    fichaMedica: null as File | null,
    autorizacionPadres: null as File | null,
    fichaJugador: null as File | null,
  };
  urlsExistentes = { fichaMedica: '', autorizacionPadres: '', fichaJugador: '' };

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
  }

  buscarNombreClub(id: string) {
    this.clubesService.getClubes().subscribe((clubes) => {
      const club = clubes.find((c) => c.id === id);
      if (club) this.clubNombre = club.nombre;
      this.cdr.detectChanges();
    });
  }

  cargarDatosJugador(id: string) {
    this.jugadoresService.getJugadorById(id).subscribe({
      next: (j) => {
        if (j) this.poblarFormulario(j);
        this.cdr.detectChanges();
      },
      error: () => {
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
      genero: j.genero,
      nacionalidad: j.nacionalidad,
      email: j.email,
      whatsapp: j.whatsapp,
      tutorPhone: j.tutorPhone,
      peso: j.peso,
      altura: j.altura,
      estado: j.estado,
      clubId: j.clubId,
    };
    this.birthDate = j.fechaNacimiento.split('T')[0];
    this.selectedHand = j.manoHabil;
    this.onDateChange(this.birthDate);
    if (j.fichaMedicaUrl) this.fileNames.fichaMedica = 'Archivo guardado';
    if (j.autorizacionUrl) this.fileNames.autorizacionPadres = 'Archivo guardado';
    if (j.fichaJugadorUrl) this.fileNames.fichaJugador = 'Archivo guardado';
  }

  get progress(): number {
    const fields = [
      this.jugadorData.dni,
      this.jugadorData.apellidos,
      this.jugadorData.nombres,
      this.birthDate,
      this.jugadorData.peso,
      this.jugadorData.altura,
      this.fileNames.fichaJugador,
    ];
    if (this.isMinor) fields.push(this.fileNames.autorizacionPadres);
    const completed = fields.filter((f) => !!f).length;
    return Math.round((completed / fields.length) * 100);
  }

  onDateChange(newDate: string) {
    if (!newDate) return;
    const age = 2026 - new Date(newDate).getFullYear();
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
    if (!this.fileNames.fichaJugador) {
      this.errorMessage = 'La Ficha de Jugador es obligatoria.';
      return;
    }
    if (this.isMinor && !this.fileNames.autorizacionPadres) {
      this.errorMessage = 'Requiere Autorización de Padres.';
      return;
    }
    if (!this.jugadorData.dni || !this.jugadorData.peso || !this.jugadorData.altura) {
      this.errorMessage = 'Peso y Altura son obligatorios.';
      return;
    }

    const formData = new FormData();
    Object.keys(this.jugadorData).forEach((key) => {
      if (this.jugadorData[key] !== null) formData.append(key, this.jugadorData[key]);
    });
    formData.append('nombreCompleto', `${this.jugadorData.apellidos}, ${this.jugadorData.nombres}`);
    formData.append('fechaNacimiento', this.birthDate);
    formData.append('categoria', this.selectedCategory);
    formData.append('manoHabil', this.selectedHand);

    if (this.files.fichaMedica) formData.append('fichaMedica', this.files.fichaMedica);
    if (this.files.fichaJugador) formData.append('fichaJugador', this.files.fichaJugador);
    if (this.isMinor && this.files.autorizacionPadres)
      formData.append('autorizacionPadres', this.files.autorizacionPadres);

    const request =
      this.isEditMode && this.jugadorId
        ? this.jugadoresService.updateJugador(this.jugadorId, formData as any)
        : this.jugadoresService.addJugador(formData as any);

    request.subscribe({
      next: () => {
        toast.success('Operación exitosa');
        window.history.back();
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error en el servidor';
        this.cdr.detectChanges();
      },
    });
  }

  onHandChange(hand: string) {
    this.selectedHand = hand;
    this.cdr.detectChanges();
  }
}
