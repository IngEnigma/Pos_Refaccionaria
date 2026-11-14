import { SaleDetailMapper } from './sale-detail.mapper';
import { SaleDetailResponseDto } from '@features/sales/infrastructure/dtos/sale-detail-response.dto';

describe('SaleDetailMapper', () => {
  const dto: SaleDetailResponseDto = {
    id: 1,
    id_producto: 20,
    id_venta: 30,
    subtotal: '240.00',
    cantidad: 2,
  };

  describe('fromResponseDto', () => {
    // Verifica que los campos snake_case se mapeen a la entidad con nombres de dominio.
    it('mapea el DTO a SaleDetail', () => {
      expect(SaleDetailMapper.fromResponseDto(dto)).toEqual({
        id: 1,
        productId: 20,
        saleId: 30,
        subtotal: 240,
        cantidad: 2,
      });
    });

    // Verifica que el subtotal string se convierta a número y conserve los centavos.
    it('convierte el subtotal string a número con centavos', () => {
      expect(SaleDetailMapper.fromResponseDto({ ...dto, subtotal: '59.97' }).subtotal).toBe(59.97);
    });

    // Verifica que un subtotal entero en string ("15") se convierta correctamente.
    it('convierte un subtotal entero en string', () => {
      expect(SaleDetailMapper.fromResponseDto({ ...dto, subtotal: '15' }).subtotal).toBe(15);
    });

    // Verifica que subtotal "0.00" sea válido.
    it('acepta subtotal "0.00"', () => {
      expect(SaleDetailMapper.fromResponseDto({ ...dto, subtotal: '0.00' }).subtotal).toBe(0);
    });

    // Verifica que una cantidad decimal (venta a granel) sea aceptada.
    it('acepta cantidad decimal', () => {
      expect(SaleDetailMapper.fromResponseDto({ ...dto, cantidad: 1.5 }).cantidad).toBe(1.5);
    });

    // Verifica que un subtotal no numérico sea rechazado.
    it('rechaza subtotal no numérico', () => {
      expect(() => SaleDetailMapper.fromResponseDto({ ...dto, subtotal: 'abc' })).toThrow(
        'SaleDetail.subtotal: money must be a non-negative number',
      );
    });

    // Verifica que un subtotal negativo sea rechazado.
    it('rechaza subtotal negativo', () => {
      expect(() => SaleDetailMapper.fromResponseDto({ ...dto, subtotal: '-1.00' })).toThrow(
        'SaleDetail.subtotal',
      );
    });

    // Verifica que una cantidad cero sea rechazada.
    it('rechaza cantidad cero', () => {
      expect(() => SaleDetailMapper.fromResponseDto({ ...dto, cantidad: 0 })).toThrow(
        'SaleDetail.cantidad: quantity must be greater than zero',
      );
    });

    // Verifica que una cantidad negativa sea rechazada.
    it('rechaza cantidad negativa', () => {
      expect(() => SaleDetailMapper.fromResponseDto({ ...dto, cantidad: -1 })).toThrow('SaleDetail.cantidad');
    });
  });

  describe('toCreateRequestDto', () => {
    // Verifica que el payload de dominio se mapee a los nombres del backend.
    it('mapea productId, saleId y cantidad a snake_case', () => {
      expect(SaleDetailMapper.toCreateRequestDto({ productId: 20, saleId: 30, cantidad: 3 })).toEqual({
        id_producto: 20,
        id_venta: 30,
        cantidad: 3,
      });
    });
  });

  describe('toUpdateRequestDto', () => {
    // Verifica que un payload completo se mapee con todas las claves.
    it('mapea todos los campos presentes', () => {
      expect(SaleDetailMapper.toUpdateRequestDto({ productId: 1, saleId: 2, cantidad: 3 })).toEqual({
        id_producto: 1,
        id_venta: 2,
        cantidad: 3,
      });
    });

    // Verifica que solo se incluyan las claves definidas (actualización parcial).
    it('solo incluye los campos definidos', () => {
      const result = SaleDetailMapper.toUpdateRequestDto({ cantidad: 5 });

      expect(result).toEqual({ cantidad: 5 });
      expect(Object.keys(result)).toEqual(['cantidad']);
    });

    // Verifica que el valor 0 se incluya (no se confunda con ausente).
    it('incluye valores 0 como definidos', () => {
      expect(SaleDetailMapper.toUpdateRequestDto({ productId: 0, cantidad: 0 })).toEqual({
        id_producto: 0,
        cantidad: 0,
      });
    });

    // Verifica que un payload vacío produzca un objeto vacío.
    it('payload vacío produce objeto vacío', () => {
      expect(SaleDetailMapper.toUpdateRequestDto({})).toEqual({});
    });
  });
});
