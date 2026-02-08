export interface Club {
  id: number;
  nombre: string;
  ubicacion: string;
  escudoUrl?: string;
  presidente?: string;
  jugadoresCount?: number; // Opcional, para mostrar en la lista
}
