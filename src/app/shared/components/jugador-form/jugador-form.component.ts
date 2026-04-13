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
    equipo: 'A',
    estado: 'Pendiente',
    clubId: '',
    categoriaEspecial: null,
  };

  birthDate = '';
  selectedCategory = '';
  isMinor = false;
  mostrarSelectorEspecial = false;
  opcionesCategoriaEspecial: string[] = [];
  selectedHand = 'Derecha';
  clubNombre = 'Cargando club...';

  fileNames = { fichaMedica: '', autorizacionPadres: '', fichaJugador: '' };
  files = {
    fichaMedica: null as File | null,
    autorizacionPadres: null as File | null,
    fichaJugador: null as File | null,
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
      equipo: j.equipo || 'A',
      categoriaEspecial: j.categoriaEspecial,
      estado: j.estado,
      clubId: j.clubId,
    };
    this.birthDate = j.fechaNacimiento.split('T')[0];
    this.selectedHand = j.manoHabil;
    this.selectedCategory = j.categoria; // Cargar la categoría guardada
    this.onDateChange(this.birthDate);

    if (j.fichaMedicaUrl) this.fileNames.fichaMedica = 'Archivo guardado';
    if (j.autorizacionUrl) this.fileNames.autorizacionPadres = 'Archivo guardado';
    if (j.fichaJugadorUrl) this.fileNames.fichaJugador = 'Archivo guardado';
  }

  soloNumeros(event: KeyboardEvent) {
    const pattern = /[0-9]/;
    const inputChar = String.fromCharCode(event.charCode);
    if (!pattern.test(inputChar)) event.preventDefault();
  }

  get progress(): number {
    const fields = [
      this.jugadorData.dni,
      this.jugadorData.apellidos,
      this.jugadorData.nombres,
      this.birthDate,
      this.fileNames.fichaJugador,
    ];
    if (this.isMinor) fields.push(this.fileNames.autorizacionPadres);
    const completed = fields.filter((f) => !!f).length;
    return Math.round((completed / fields.length) * 100);
  }

  onDateChange(newDate: string) {
    if (!newDate) return;
    const birthYear = new Date(newDate).getFullYear();
    const age = 2026 - birthYear;

    this.isMinor = age < 18;

    if (age <= 12) this.selectedCategory = 'Infantiles';
    else if (age <= 14) this.selectedCategory = 'Menores';
    else if (age <= 16) this.selectedCategory = 'Cadetes';
    else if (age <= 18) this.selectedCategory = 'Juveniles';
    else this.selectedCategory = 'Primera';

    if (age >= 35) {
      this.mostrarSelectorEspecial = true;
      this.opcionesCategoriaEspecial = ['Primera', '+35'];
      if (!this.isEditMode && !this.jugadorData.categoriaEspecial) {
        this.jugadorData.categoriaEspecial = 'Primera';
      }
    } else {
      this.mostrarSelectorEspecial = false;
      this.jugadorData.categoriaEspecial = null;
    }

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

  // jugador-form.component.ts

  onFinalize() {
    this.errorMessage = '';

    // Validaciones básicas
    if (!this.fileNames.fichaJugador) {
      this.errorMessage = 'La Ficha de Jugador es obligatoria.';
      return;
    }
    if (this.isMinor && !this.fileNames.autorizacionPadres) {
      this.errorMessage = 'Los menores requieren Autorización de Padres.';
      return;
    }

    const formData = new FormData();

    // 1. Datos base: Solo agregar si tienen valor real
    Object.keys(this.jugadorData).forEach((key) => {
      const value = this.jugadorData[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    // 2. Datos obligatorios calculados
    formData.append(
      'nombreCompleto',
      `${this.jugadorData.apellidos.toUpperCase()}, ${this.jugadorData.nombres.toUpperCase()}`,
    );
    formData.append('fechaNacimiento', this.birthDate);
    formData.append('categoria', this.selectedCategory); // La categoría que calculaste en onDateChange
    formData.append('manoHabil', this.selectedHand);

    // 3. Archivos (Solo si son nuevos archivos de tipo File)
    if (this.files.fichaMedica instanceof File)
      formData.append('fichaMedica', this.files.fichaMedica);
    if (this.files.fichaJugador instanceof File)
      formData.append('fichaJugador', this.files.fichaJugador);
    if (this.isMinor && this.files.autorizacionPadres instanceof File) {
      formData.append('autorizacionPadres', this.files.autorizacionPadres);
    }

    const request =
      this.isEditMode && this.jugadorId
        ? this.jugadoresService.updateJugador(this.jugadorId, formData as any)
        : this.jugadoresService.addJugador(formData as any);

    request.subscribe({
      next: () => {
        toast.success('¡Jugador registrado con éxito!');
        window.history.back();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err.error?.error || 'Error al conectar con el servidor';
        this.cdr.detectChanges();
      },
    });
  }

  onHandChange(hand: string) {
    this.selectedHand = hand;
    this.cdr.detectChanges();
  }
}
