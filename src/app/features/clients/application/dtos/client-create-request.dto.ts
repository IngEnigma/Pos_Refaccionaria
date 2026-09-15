export interface ClientCreateRequestDto {
  id_sucursal: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  telefono: string;
  correo?: string | null;
  direccion?: string | null;
  rfc?: string | null;
}
