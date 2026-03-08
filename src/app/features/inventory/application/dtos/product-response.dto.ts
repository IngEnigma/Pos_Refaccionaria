export interface ProductResponseDto {
  id: number;
  id_tipo: number | null;
  id_proveedor: number | null;
  id_movimientos: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigo_barras: string;
  precio_venta: number;
  marca: string;
  existencia: number;
  costo: number;
  codigo_sat: string | null;
  codigoSAT?: string | null;
}
