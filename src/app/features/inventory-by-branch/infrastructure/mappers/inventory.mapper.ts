import { BranchInventoryDto, InventoryItemDto } from '../../application/dtos/inventory-response.dto';
import { BranchInventory } from '../../domain/entities/inventory.entity';
import { InventoryItem } from '../../domain/entities/inventory-item.entity';

export class InventoryMapper {
  static fromBranchInventoryDto(dto: BranchInventoryDto): BranchInventory {
    return {
      idInventario: dto.id_inventario,
      descripcion: dto.descripcion,
      idSucursal: dto.id_sucursal,
      detalles: dto.detalles.map(InventoryMapper.fromInventoryItemDto),
    };
  }

  static fromInventoryItemDto(dto: InventoryItemDto): InventoryItem {
    return {
      id: dto.id,
      idProducto: dto.id_producto,
      nombre: dto.nombre,
      clave: dto.clave,
      marca: dto.marca,
      codigoBarras: dto.codigo_barras,
      precioVenta: parseFloat(dto.precio_venta),
      precioSucursal: dto.precio_sucursal !== null ? parseFloat(dto.precio_sucursal) : null,
      precioBase: parseFloat(dto.precio_base),
      costo: parseFloat(dto.costo),
      cantidad: dto.cantidad,
    };
  }
}
