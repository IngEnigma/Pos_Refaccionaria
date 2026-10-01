export interface InventoryItemDto {
  id: number;
  id_producto: number;
  nombre: string;
  clave: string;
  marca: string;
  codigo_barras: string;
  precio_venta: string;
  precio_sucursal: string | null;
  precio_base: string;
  costo: string;
  cantidad: number;
  vigente_desde: string | null;
}

export interface BranchInventoryDto {
  id_inventario: number;
  descripcion: string;
  id_sucursal: number;
  detalles: InventoryItemDto[];
}
