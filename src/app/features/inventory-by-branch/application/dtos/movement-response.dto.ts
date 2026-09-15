export interface MovementResponseDto {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  razon: string;
  observaciones: string | null;
}

export interface RegisterMovementRequestDto {
  id_inventario: number;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  razon: string;
  observaciones?: string;
  id_proveedor?: number;
  items: { id_producto: number; cantidad: number }[];
}
