import { InventoryItem } from './inventory-item.entity';

export interface BranchInventory {
  idInventario: number;
  descripcion: string;
  idSucursal: number;
  detalles: InventoryItem[];
}
