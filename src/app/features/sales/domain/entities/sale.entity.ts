export interface Sale {
  id: number;
  idUsuario: number | null;
  idMetodoPago: number | null;
  total: number;
  fecha: string;
}
