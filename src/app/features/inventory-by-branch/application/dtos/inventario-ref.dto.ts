export interface InventarioRefDto {
  id: number;
  descripcion: string;
  id_sucursal: number;
}

export interface CreateInventarioRequestDto {
  id_sucursal: number;
  descripcion: string;
}
