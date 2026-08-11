import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TorneosService } from '../../../core/services/torneos.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-torneos-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './torneos-form.html',
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

  themes = [
    { name: 'Azul Pizarra', class: 'from-blue-600 to-indigo-950' },
    { name: 'Lava', class: 'from-red-600 to-orange-950' },
    { name: 'Amazonas', class: 'from-emerald-500 to-teal-950' },
    { name: 'Galaxy', class: 'from-purple-600 to-fuchsia-950' },
    { name: 'Carbono', class: 'from-slate-700 to-slate-950' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  private initForm(): void {
    this.torneoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      categoria: ['Primera División', Validators.required],
      rama: ['Masculino', Validators.required],
      formato: ['liga', Validators.required],
      idaVuelta: [false],
      fechaInicio: ['', Validators.required],
      colorClase: [this.themes[0].class, Validators.required],
      progreso: [0],
    });
  }

  private checkEditMode(): void {
    this.torneoId = this.route.snapshot.paramMap.get('id');
    if (this.torneoId) {
      this.isEditMode = true;
      this.loading = true;
      this.torneosService.getTorneoById(this.torneoId).subscribe({
        next: (torneo) => {
          this.torneoForm.patchValue({
            ...torneo,
            formato: torneo.formato || 'liga',
            idaVuelta: torneo.idaVuelta ?? false,
          });
          this.loading = false;
        },
        error: () => {
          toast.error('No se pudo recuperar el torneo');
          this.router.navigate(['/torneos']);
        },
      });
    }
  }

  setRama(rama: string): void {
    this.torneoForm.patchValue({ rama });
  }

  setFormato(formato: string): void {
    this.torneoForm.patchValue({ formato });
  }

  toggleIdaVuelta(): void {
    const actual = this.torneoForm.get('idaVuelta')?.value;
    this.torneoForm.patchValue({ idaVuelta: !actual });
  }

  setTheme(themeClass: string): void {
    this.torneoForm.patchValue({ colorClase: themeClass });
  }

  onSubmit(): void {
    if (this.torneoForm.invalid) {
      this.torneoForm.markAllAsTouched();
      toast.error('Completa los campos requeridos');
      return;
    }

    this.loading = true;

    // 1. Manejo de la fecha para evitar desfases de zona horaria
    const fechaSeleccionada = new Date(this.torneoForm.value.fechaInicio);
    // Sumamos la diferencia horaria para que no se guarde el día anterior
    fechaSeleccionada.setMinutes(
      fechaSeleccionada.getMinutes() + fechaSeleccionada.getTimezoneOffset(),
    );

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 2. Lógica de estado automática
    const estadoCalculado = fechaSeleccionada <= hoy ? 'In Progress' : 'Upcoming';

    // 3. Construcción del objeto final (Payload)
    const payload = {
      nombre: this.torneoForm.value.nombre,
      categoria: this.torneoForm.value.categoria,
      rama: this.torneoForm.value.rama,
      fechaInicio: fechaSeleccionada.toISOString(),
      colorClase: this.torneoForm.value.colorClase,
      estado: estadoCalculado,
      progreso: 0,
      formato: this.torneoForm.value.formato || 'liga',
      idaVuelta: Boolean(this.torneoForm.value.idaVuelta),
    };

    const request = this.isEditMode
      ? this.torneosService.updateTorneo(this.torneoId!, payload)
      : this.torneosService.crearTorneo(payload);

    request.subscribe({
      next: () => {
        toast.success(this.isEditMode ? 'Torneo actualizado' : 'Torneo creado con éxito');
        this.router.navigate(['/torneos']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error 500 del Servidor:', err);
        toast.error('Error interno del servidor. Revisa la consola del backend.');
      },
    });
  }
}
