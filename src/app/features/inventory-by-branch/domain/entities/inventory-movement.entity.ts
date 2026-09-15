export type MovementType = 'ENTRADA' | 'SALIDA';

export interface InventoryMovement {
  id: number;
  tipo: MovementType;
  cantidad: number;
  fecha: string;
  razon: string;
  observaciones: string | null;
}

export interface RegisterMovementPayload {
  idInventario: number;
  tipoMovimiento: MovementType;
  razon: string;
  observaciones?: string;
  idProveedor?: number;
  items: { idProducto: number; cantidad: number }[];
}

export interface InventarioRef {
  id: number;
  descripcion: string;
  idSucursal: number;
}
