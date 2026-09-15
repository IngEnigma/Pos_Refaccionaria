export interface ProductResponseDto {
  id: number;
  id_tipo: number | null;
  id_proveedor: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigo_barras: string;
  precio_venta: number;
  marca: string;
  costo: number;
  codigoSAT: string | null;
}

export interface ProductStockResponseDto extends ProductResponseDto {
  cantidad: number;
  precio_sucursal: string | null;
  precio_base: string;
  vigente_desde: string | null;
  id_sucursal: number;
}

export interface PaginatedProductResponseDto {
  data?: ProductResponseDto[];
  results?: ProductResponseDto[];
  total: number;
  page: number;
  limit?: number;
  page_size?: number;
}
