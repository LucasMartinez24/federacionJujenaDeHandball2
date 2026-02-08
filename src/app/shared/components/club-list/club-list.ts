import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JugadoresService, Jugador } from '../../../core/services/jugadores.service';

interface Club {
  id: number;
  nombre: string;
  jugadores: Jugador[];
}

@Component({
  selector: 'app-club-list',
  imports: [CommonModule, RouterModule],
  templateUrl: './club-list.html',
  styleUrl: './club-list.css',
})
export class ClubList implements OnInit {
  clubes: Club[] = [
    { id: 1, nombre: 'CIAF', jugadores: [] },
    { id: 2, nombre: 'Minas Handball', jugadores: [] },
  ];

  selectedClub: Club | null = null;

  constructor(private jugadoresService: JugadoresService) {}

  ngOnInit(): void {
    this.loadClubsWithJugadores();
    if (this.clubes.length > 0) {
      this.selectClub(this.clubes[0]);
    }
  }

  loadClubsWithJugadores(): void {
    this.clubes = this.clubes.map((club) => ({
      ...club,
      jugadores: this.jugadoresService.getJugadoresByClub(club.id),
    }));
  }

  selectClub(club: Club): void {
    this.selectedClub = this.clubes.find((c) => c.id === club.id) || null;
  }

  getTotalJugadores(clubId: number): number {
    return this.jugadoresService.getJugadoresByClub(clubId).length;
  }

  getTotalAllJugadores(): number {
    return this.jugadoresService.getAllJugadores().length;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
