import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-jugador-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './jugador-form.component.html',
  styleUrl: './jugador-form.component.css',
})
export class JugadorFormComponent {
  // Datos del formulario vinculados
  birthDate: string = '';
  selectedCategory: string = '';
  isMinor: boolean = false;
  selectedHand: string = 'Derecha';

  clubs = ['CIAF Jujuy', 'Minas Handball'];

  // Mantenemos la lista para el select
  categoriesList = [
    'Infantiles (u12)',
    'Menores (u14)',
    'Cadetes (u16)',
    'Juveniles (u18)',
    'Mayores (Senior)',
  ];

  // Lógica de cálculo de categoría
  onDateChange(newDate: string) {
    if (!newDate) return;

    const birth = new Date(newDate);
    const today = new Date();

    // En el handball, la categoría se suele definir por el año de nacimiento
    const age = today.getFullYear() - birth.getFullYear();

    // Actualizar si es menor (para la UI)
    this.isMinor = age < 18;

    // Asignación automática de categoría
    if (age <= 12) this.selectedCategory = 'Infantiles (u12)';
    else if (age <= 14) this.selectedCategory = 'Menores (u14)';
    else if (age <= 16) this.selectedCategory = 'Cadetes (u16)';
    else if (age <= 18) this.selectedCategory = 'Juveniles (u18)';
    else this.selectedCategory = 'Mayores (Senior)';
  }

  onHandChange(hand: string) {
    this.selectedHand = hand;
  }

  onSaveDraft() {
    console.log('Borrador guardado');
  }
  onFinalize() {
    console.log('Registro finalizado');
  }
}
