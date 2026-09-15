import { MovementResponseDto, RegisterMovementRequestDto } from '../../application/dtos/movement-response.dto';
import { InventoryMovement, RegisterMovementPayload } from '../../domain/entities/inventory-movement.entity';

export class MovementMapper {
  static fromResponseDto(dto: MovementResponseDto): InventoryMovement {
    return {
      id: dto.id,
      tipo: dto.tipo,
      cantidad: dto.cantidad,
      fecha: dto.fecha,
      razon: dto.razon,
      observaciones: dto.observaciones,
    };
  }

  static toRegisterRequestDto(payload: RegisterMovementPayload): RegisterMovementRequestDto {
    return {
      id_inventario: payload.idInventario,
      tipo_movimiento: payload.tipoMovimiento,
      razon: payload.razon,
      observaciones: payload.observaciones,
      id_proveedor: payload.idProveedor,
      items: payload.items.map((item) => ({
        id_producto: item.idProducto,
        cantidad: item.cantidad,
      })),
    };
  }
}
