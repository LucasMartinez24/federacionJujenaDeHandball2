import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core'; // Añadimos OnInit
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // Añadimos ActivatedRoute
import { ClubesService } from '../../../core/services/clubes.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-club-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './club-create.html',
  styleUrl: './club-create.css',
})
export class ClubCreate implements OnInit {
  private fb = inject(FormBuilder);
  private clubesService = inject(ClubesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  // 2. Inyectamos el detector de cambios
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  showPassword = false;
  isEditMode = false;
  clubId: string | null = null;
  logoFile: File | null = null;
  logoPreview: string | null = null;

  clubForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    siglas: ['', [Validators.required, Validators.maxLength(5), Validators.pattern('^[a-zA-Z]+$')]],
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit(): void {
    this.clubId = this.route.snapshot.queryParamMap.get('id');
    const editParam = this.route.snapshot.queryParamMap.get('edit');

    if (this.clubId && editParam === 'true') {
      this.isEditMode = true;
      this.prepararEdicion();
    }
  }

  prepararEdicion() {
    // Ya no ponemos this.loading = true;

    this.clubForm.get('password')?.clearValidators();
    this.clubForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.clubForm.get('password')?.updateValueAndValidity();

    this.clubesService.getClubes().subscribe({
      next: (clubes) => {
        const club = clubes.find((c) => c.id === this.clubId);
        if (club) {
          this.clubForm.patchValue({
            nombre: club.nombre,
            siglas: club.siglas,
            username: club.username,
          });
          if (club.logoUrl) {
            this.logoPreview = `http://localhost:3000${club.logoUrl}`;
          }
        }
        // Ya no necesitamos poner this.loading = false; aquí
      },
      error: () => {
        toast.error('Error al cargar datos del club');
      },
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.clubForm.invalid) {
      this.clubForm.markAllAsTouched();
      toast.error('Formulario inválido');
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('nombre', this.clubForm.get('nombre')?.value);
    formData.append('siglas', this.clubForm.get('siglas')?.value.toUpperCase());
    formData.append('username', this.clubForm.get('username')?.value);

    // Solo enviamos password si el usuario escribió algo (importante en edición)
    const pass = this.clubForm.get('password')?.value;
    if (pass) {
      formData.append('password', pass);
    }

    if (this.logoFile) {
      formData.append('logo', this.logoFile);
    }

    // Lógica divergente: Update o Create
    const request =
      this.isEditMode && this.clubId
        ? this.clubesService.updateClub(this.clubId, formData) // Debes crear este método en el service
        : this.clubesService.createClub(formData);

    request.subscribe({
      next: () => {
        toast.success(this.isEditMode ? 'Club actualizado' : 'Club registrado');
        this.loading = false;
        this.router.navigate(['/clubes']);
      },
      error: (err) => {
        this.loading = false;
        toast.error('Error en la operación', {
          description: err.error?.message || 'Error de servidor',
        });
      },
    });
  }
}
