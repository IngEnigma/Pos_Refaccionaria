export interface ProductUpdateRequestDto {
  id_tipo?: number | null;
  id_proveedor?: number | null;
  id_movimientos?: number | null;
  clave?: string;
  nombre?: string;
  descripcion?: string | null;
  codigo_barras?: string;
  precio_venta?: number;
  marca?: string;
  existencia?: number;
  costo?: number;
  codigoSAT?: string | null;
}
