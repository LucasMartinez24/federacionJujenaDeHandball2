import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClubesService } from '../../../core/services/clubes.service';

@Component({
  selector: 'app-club-create',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './club-create.html',
  styleUrl: './club-create.css',
})
export class ClubCreate {
  private fb = inject(FormBuilder);
  private clubesService = inject(ClubesService);
  private router = inject(Router);

  loading = false;
  errorMessage = '';
  showPassword = false;

  // Definición del formulario con validaciones
  clubForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    siglas: ['', [Validators.required, Validators.maxLength(5), Validators.pattern('^[A-Z]+$')]],
    username: ['', [Validators.required, Validators.minLength(4)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.clubForm.invalid) {
      // Marcar todos como "touched" para que se disparen los colores de validación rojo
      this.clubForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Enviamos los datos al backend
    this.clubesService.createClub(this.clubForm.value).subscribe({
      next: (res) => {
        console.log('Club creado:', res);
        this.loading = false;
        // Redirigir a la lista de clubes tras el éxito
        this.router.navigate(['/clubes']);
      },
      error: (err) => {
        this.loading = false;
        // Manejo de errores específicos del backend (ej: usuario ya existe)
        this.errorMessage = err.error?.message || 'Error al registrar el club. Intente nuevamente.';
        console.error('Error en el registro:', err);
      },
    });
  }
}
