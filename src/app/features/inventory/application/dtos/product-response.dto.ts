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
  codigoSAT: string | null;
}

export interface PaginatedProductResponseDto {
  data?: ProductResponseDto[];
  results?: ProductResponseDto[];
  total: number;
  page: number;
  limit?: number;
  page_size?: number;
}
