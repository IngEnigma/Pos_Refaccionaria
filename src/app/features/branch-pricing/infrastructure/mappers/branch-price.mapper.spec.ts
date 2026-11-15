import { BranchPriceResponseDto } from '@features/branch-pricing/application/dtos/branch-price-response.dto';
import { PriceHistoryResponseDto } from '@features/branch-pricing/application/dtos/price-history-response.dto';
import { SetBranchPricePayload } from '@features/branch-pricing/domain/repository/branch-price-repository';
import { BranchPriceMapper } from './branch-price.mapper';

describe('BranchPriceMapper', () => {
  const makeDto = (overrides: Partial<BranchPriceResponseDto> = {}): BranchPriceResponseDto => ({
    id: 11,
    id_producto: 5,
    id_sucursal: 2,
    precio_venta: '12.50',
    vigente_desde: '2026-03-01T10:00:00-06:00',
    activo: true,
    ...overrides,
  });

  describe('fromResponseDto', () => {
    it('mapea los campos snake_case del backend a camelCase del dominio', () => {
      const price = BranchPriceMapper.fromResponseDto(makeDto());

      expect(price).toEqual({
        id: 11,
        idProducto: 5,
        idSucursal: 2,
        precioVenta: 12.5,
        vigenteDesde: '2026-03-01T10:00:00-06:00',
        activo: true,
      });
    });

    it('convierte el precio string del backend ("12.50") a number', () => {
      const price = BranchPriceMapper.fromResponseDto(makeDto({ precio_venta: '12.50' }));

      expect(typeof price.precioVenta).toBe('number');
      expect(price.precioVenta).toBe(12.5);
    });

    it.each([
      ['1234.56', 1234.56],
      ['99999999.99', 99999999.99],
      ['0.01', 0.01],
      ['100', 100],
      ['100.00', 100],
    ])('conserva el valor del precio "%s" como %p', (raw, expected) => {
      expect(BranchPriceMapper.fromResponseDto(makeDto({ precio_venta: raw })).precioVenta).toBe(expected);
    });

    it('mapea un precio "0.00" a 0 sin tratarlo como ausente', () => {
      const price = BranchPriceMapper.fromResponseDto(makeDto({ precio_venta: '0.00' }));

      expect(price.precioVenta).toBe(0);
    });

    it('conserva un precio inactivo (activo=false)', () => {
      expect(BranchPriceMapper.fromResponseDto(makeDto({ activo: false })).activo).toBe(false);
    });

    // H-36: antes parseFloat producía NaN y la tabla pintaba "$NaN".
    it.each(['abc', '', null as unknown as string])('rechaza precio_venta inválido (%p)', (bad) => {
      expect(() => BranchPriceMapper.fromResponseDto(makeDto({ precio_venta: bad }))).toThrow(/precio_venta/);
    });
  });

  describe('fromHistoryResponseDto', () => {
    const makeHistory = (overrides: Partial<PriceHistoryResponseDto> = {}): PriceHistoryResponseDto => ({
      id: 3,
      id_producto: 5,
      id_sucursal: 2,
      precio_venta: '8.00',
      vigente_desde: '2026-01-15T08:30:00-06:00',
      activo: false,
      ...overrides,
    });

    it('mapea un ítem del historial con precio numérico y estado inactivo', () => {
      const item = BranchPriceMapper.fromHistoryResponseDto(makeHistory());

      expect(item).toEqual({
        id: 3,
        idProducto: 5,
        idSucursal: 2,
        precioVenta: 8,
        vigenteDesde: '2026-01-15T08:30:00-06:00',
        activo: false,
      });
    });

    it('convierte precios con decimales del historial ("10.99") a number', () => {
      expect(BranchPriceMapper.fromHistoryResponseDto(makeHistory({ precio_venta: '10.99' })).precioVenta).toBe(10.99);
    });

    it('mapea un precio "0.00" del historial a 0', () => {
      expect(BranchPriceMapper.fromHistoryResponseDto(makeHistory({ precio_venta: '0.00' })).precioVenta).toBe(0);
    });

    it('rechaza un precio del historial no numérico (H-36)', () => {
      expect(() => BranchPriceMapper.fromHistoryResponseDto(makeHistory({ precio_venta: 'x' }))).toThrow(/precio_venta/);
    });
  });

  describe('toCreateRequestDto', () => {
    it('mapea el payload del dominio a snake_case', () => {
      const payload: SetBranchPricePayload = { idProducto: 5, idSucursal: 2, precioVenta: 12.5 };

      expect(BranchPriceMapper.toCreateRequestDto(payload)).toEqual({
        id_producto: 5,
        id_sucursal: 2,
        precio_venta: 12.5,
      });
    });

    it('envía el precio como number (no string) y sin redondear', () => {
      const dto = BranchPriceMapper.toCreateRequestDto({ idProducto: 1, idSucursal: 1, precioVenta: 10.999 });

      expect(typeof dto.precio_venta).toBe('number');
      expect(dto.precio_venta).toBe(10.999);
    });

    it('conserva un precio 0 tal cual (la validación es responsabilidad de otra capa)', () => {
      expect(BranchPriceMapper.toCreateRequestDto({ idProducto: 1, idSucursal: 1, precioVenta: 0 }).precio_venta).toBe(0);
    });
  });

  it('ida y vuelta: un precio del backend ("12.50") vuelve a enviarse como 12.5', () => {
    const price = BranchPriceMapper.fromResponseDto(makeDto({ precio_venta: '12.50' }));

    const request = BranchPriceMapper.toCreateRequestDto({
      idProducto: price.idProducto,
      idSucursal: price.idSucursal,
      precioVenta: price.precioVenta,
    });

    expect(request).toEqual({ id_producto: 5, id_sucursal: 2, precio_venta: 12.5 });
  });
});
