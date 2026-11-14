import { MovementMapper } from './movement.mapper';
import { MovementResponseDto } from '@features/inventory-by-branch/application/dtos/movement-response.dto';
import { RegisterMovementPayload } from '@features/inventory-by-branch/domain/entities/inventory-movement.entity';

// Unitario: transformaciones puras DTO <-> dominio de movimientos de inventario.
describe('MovementMapper', () => {
  const dto: MovementResponseDto = {
    id: 12,
    tipo: 'ENTRADA',
    cantidad: 10,
    fecha: '2026-09-18T12:00:00Z',
    razon: 'Compra',
    observaciones: 'Factura F-001',
  };

  // Comprueba que la respuesta del backend se copie campo por campo a la entidad.
  it('fromResponseDto copia los campos del movimiento', () => {
    expect(MovementMapper.fromResponseDto(dto)).toEqual({
      id: 12,
      tipo: 'ENTRADA',
      cantidad: 10,
      fecha: '2026-09-18T12:00:00Z',
      razon: 'Compra',
      observaciones: 'Factura F-001',
    });
  });

  // Comprueba que un payload de alta se envíe en snake_case con sus items convertidos.
  it('toRegisterRequestDto convierte el payload y sus items a snake_case', () => {
    const payload: RegisterMovementPayload = {
      idInventario: 3,
      tipoMovimiento: 'SALIDA',
      razon: 'Merma',
      observaciones: 'Producto dañado',
      idProveedor: 9,
      items: [
        { idProducto: 5, cantidad: 2 },
        { idProducto: 7, cantidad: 1 },
      ],
    };

    expect(MovementMapper.toRegisterRequestDto(payload)).toEqual({
      id_inventario: 3,
      tipo_movimiento: 'SALIDA',
      razon: 'Merma',
      observaciones: 'Producto dañado',
      id_proveedor: 9,
      items: [
        { id_producto: 5, cantidad: 2 },
        { id_producto: 7, cantidad: 1 },
      ],
    });
  });

  // Comprueba que los campos opcionales ausentes queden como undefined (el backend los ignora).
  it('toRegisterRequestDto deja opcionales ausentes como undefined', () => {
    const payload: RegisterMovementPayload = {
      idInventario: 3,
      tipoMovimiento: 'ENTRADA',
      razon: 'Compra',
      items: [{ idProducto: 1, cantidad: 1 }],
    };

    const request = MovementMapper.toRegisterRequestDto(payload);

    expect(request.observaciones).toBeUndefined();
    expect(request.id_proveedor).toBeUndefined();
  });
});
