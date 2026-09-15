export interface ClientResponseDto {
  id: number;
  id_sucursal: number | null;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  rfc: string | null;
}
