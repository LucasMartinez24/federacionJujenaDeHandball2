export interface Jugador {
  id?: number; // Generado automáticamente por el sistema
  dni: number;
  apellidos: string;
  nombres: string;
  fechaNacimiento: string; // Formato YYYY-MM-DD
  genero: 'Masculino' | 'Femenino' | 'Otro';

  // Datos de la Federación
  club: string;
  categoria: string; // Calculada automáticamente (Infantiles, Cadetes, etc.)
  tipo: 'Jugador' | 'Entrenador'; // Campo "¿JUGADOR O ENTRENADOR?" del Excel

  // Datos de Contacto
  email?: string;
  celularJugador?: string;
  celularTutor?: string; // Obligatorio para menores de 18 años

  // Datos Físicos (Para el Dashboard de Rendimiento)
  peso?: number;
  altura?: number;
  manoHabil?: 'Derecha' | 'Izquierda' | 'Ambidiestro';

  // Documentación Digital (Fichaje Digital)
  aptoMedico?: string; // Aquí guardaremos el Base64 o la URL del archivo
  fotoDni?: string; // Imagen del DNI

  // Auditoría y Control
  fechaRegistro?: string; // Fecha y hora exacta de la carga
  usuarioRegistro?: string; // Quién realizó la carga (para el Módulo de Auditoría)
}
