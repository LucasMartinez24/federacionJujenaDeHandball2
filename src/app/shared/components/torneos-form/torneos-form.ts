import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TorneosService } from '../../../core/services/torneos.service';
import { toast } from 'ngx-sonner';
@Component({
  selector: 'app-torneos-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './torneos-form.html',
  styleUrl: './torneos-form.css',
})
export class TorneosForm implements OnInit {
  private fb = inject(FormBuilder);
  private torneosService = inject(TorneosService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  torneoForm!: FormGroup;
  isEditMode = false;
  torneoId: string | null = null;
  loading = false;

  // Opciones de Temas Visuales (colorClase)
  themes = [
    { name: 'Classic Blue', class: 'from-primary to-blue-800' },
    { name: 'Sunset Fire', class: 'from-orange-500 to-red-700' },
    { name: 'Forest Depth', class: 'from-emerald-600 to-teal-800' },
    { name: 'Royal Purple', class: 'from-indigo-600 to-purple-800' },
    { name: 'Midnight Slate', class: 'from-slate-700 to-slate-900' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.torneoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['Primera División A', Validators.required],
      rama: ['Male', Validators.required],
      estado: ['Upcoming', Validators.required],
      fechaInicio: ['', Validators.required],
      progreso: [0],
      formato: ['elimination', Validators.required], // elimination, league, super4
      idaVuelta: [false], // Nueva opción para Ligas
      colorClase: ['from-primary to-blue-800', Validators.required],
    });
  }

  // Método para el checkbox de ida y vuelta
  toggleIdaVuelta() {
    const current = this.torneoForm.get('idaVuelta')?.value;
    this.torneoForm.patchValue({ idaVuelta: !current });
  }

  private checkEditMode(): void {
    this.torneoId = this.route.snapshot.paramMap.get('id');
    if (this.torneoId) {
      this.isEditMode = true;
      // Aquí cargarías los datos del torneo desde tu servicio
      // this.torneosService.getTorneoById(this.torneoId).subscribe(...)
    }
  }

  setRama(rama: string): void {
    this.torneoForm.patchValue({ rama });
  }

  setTheme(themeClass: string): void {
    this.torneoForm.patchValue({ colorClase: themeClass });
  }

  onSubmit(): void {
    if (this.torneoForm.invalid) {
      this.torneoForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const request = this.isEditMode
      ? this.torneosService.updateTorneo(this.torneoId!, this.torneoForm.value)
      : this.torneosService.crearTorneo(this.torneoForm.value);

    request.subscribe({
      next: () => {
        toast.success(this.isEditMode ? 'Torneo actualizado' : 'Torneo creado con éxito');
        this.router.navigate(['/torneos']);
      },
      error: (err) => {
        this.loading = false;
        toast.error('Error al procesar la solicitud');
      },
    });
  }
}
