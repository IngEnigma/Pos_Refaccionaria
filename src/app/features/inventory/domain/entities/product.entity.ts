export interface Product {
  id: number;
  idTipo: number | null;
  idProveedor: number | null;
  idMovimientos: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigoBarras: string;
  precioVenta: number;
  marca: string;
  existencia: number;
  costo: number;
  codigoSat: string | null;
}
