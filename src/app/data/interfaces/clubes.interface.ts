export interface User {
  id: number;
  nombre: string;
  ubicacion: string;
  siglas: string;
  escudoUrl?: string;
  presidente?: string;
  jugadoresCount?: number; // Opcional, para mostrar en la lista
}
