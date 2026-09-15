export interface Client {
  id: number;
  idSucursal: number | null;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  rfc: string | null;
}
