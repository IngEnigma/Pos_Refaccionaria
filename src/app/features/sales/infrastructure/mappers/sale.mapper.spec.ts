import { SaleMapper } from './sale.mapper';
import { Sale } from '@features/sales/domain/entities/sale.entity';
import { SaleResponseDto } from '@features/sales/infrastructure/dtos/sale-response.dto';

describe('SaleMapper', () => {
  const dto: SaleResponseDto = {
    id: 10,
    id_usuario: 3,
    id_sucursal: 7,
    id_metodo_pago: 2,
    id_cliente: null,
    estado: 'completada',
    subtotal: '120.00',
    iva: '19.20',
    total: '139.20',
    fecha: '2025-01-15T10:00:00Z',
  };

  describe('fromResponseDto', () => {
    // Verifica que los campos snake_case del backend se mapeen a la entidad Sale.
    it('mapea el DTO a una entidad Sale', () => {
      const sale = SaleMapper.fromResponseDto(dto);

      expect(sale).toBeInstanceOf(Sale);
      expect(sale.id).toBe(10);
      expect(sale.idUsuario).toBe(3);
      expect(sale.idSucursal).toBe(7);
      expect(sale.idMetodoPago).toBe(2);
      expect(sale.fecha?.value).toBe('2025-01-15T10:00:00Z');
    });

    // Verifica que el total string numérico del backend se convierta a número.
    it('convierte el total string a número', () => {
      expect(SaleMapper.fromResponseDto(dto).total.value).toBe(139.2);
    });

    // Verifica que un total entero como string ("50") también se convierta.
    it('convierte un total entero en string', () => {
      expect(SaleMapper.fromResponseDto({ ...dto, total: '50' }).total.value).toBe(50);
    });

    // Verifica que un total "0.00" sea válido.
    it('acepta total "0.00"', () => {
      expect(SaleMapper.fromResponseDto({ ...dto, total: '0.00' }).total.value).toBe(0);
    });

    // Verifica que los campos nulos del backend se conserven como null.
    it('conserva usuario, sucursal, método de pago y fecha nulos', () => {
      const sale = SaleMapper.fromResponseDto({
        ...dto,
        id_usuario: null,
        id_sucursal: null,
        id_metodo_pago: null,
        fecha: null,
      });

      expect(sale.idUsuario).toBeNull();
      expect(sale.idSucursal).toBeNull();
      expect(sale.idMetodoPago).toBeNull();
      expect(sale.fecha).toBeNull();
    });

    // Verifica que un total no numérico sea rechazado con el contexto Sale.total.
    it('rechaza total no numérico', () => {
      expect(() => SaleMapper.fromResponseDto({ ...dto, total: 'abc' })).toThrow(
        'Sale.total: money must be a non-negative number',
      );
    });

    // Verifica que un total negativo sea rechazado.
    it('rechaza total negativo', () => {
      expect(() => SaleMapper.fromResponseDto({ ...dto, total: '-5.00' })).toThrow(
        'Sale.total: money must be a non-negative number',
      );
    });

    // Verifica que una fecha inválida sea rechazada con el contexto Sale.fecha.
    it('rechaza fecha inválida', () => {
      expect(() => SaleMapper.fromResponseDto({ ...dto, fecha: 'no-fecha' })).toThrow(
        'Sale.fecha: sale date must be an ISO date string',
      );
    });

    // Number("") y Number(null) valen 0: un total vacío o null del backend se acepta como venta de $0.
    it.each([[''], [null], ['  ']])('H-26: rechaza total vacío o null (%p)', (total) => {
      expect(() => SaleMapper.fromResponseDto({ ...dto, total: total as unknown as string })).toThrow(
        'Sale.total: money must be a non-negative number',
      );
    });
  });

  describe('toCreateRequestDto', () => {
    // Verifica que con cliente registrado se envíen id_metodo_pago e id_cliente.
    it('incluye id_cliente cuando hay cliente registrado', () => {
      expect(SaleMapper.toCreateRequestDto({ idMetodoPago: 2, idCliente: 15 })).toEqual({
        id_metodo_pago: 2,
        id_cliente: 15,
      });
    });

    // Verifica que sin cliente (Público general) la clave id_cliente no exista en absoluto.
    it('omite id_cliente cuando no viene (Público general)', () => {
      const result = SaleMapper.toCreateRequestDto({ idMetodoPago: 2 });

      expect(result).toEqual({ id_metodo_pago: 2 });
      expect('id_cliente' in result).toBe(false);
    });

    // Verifica que idCliente undefined explícito tampoco genere la clave.
    it('omite id_cliente cuando idCliente es undefined', () => {
      expect('id_cliente' in SaleMapper.toCreateRequestDto({ idMetodoPago: 2, idCliente: undefined })).toBe(false);
    });

    // Verifica que idCliente null (que el tipo no permite pero llega desde formularios) nunca se envíe como null.
    it('omite id_cliente cuando idCliente es null, nunca lo envía como null', () => {
      const payload = { idMetodoPago: 2, idCliente: null } as unknown as { idMetodoPago: number };
      const result = SaleMapper.toCreateRequestDto(payload);

      expect('id_cliente' in result).toBe(false);
      expect(JSON.stringify(result)).not.toContain('null');
    });
  });

  describe('toUpdateRequestDto', () => {
    // Verifica que un payload completo se mapee a los nombres del backend.
    it('mapea todos los campos a snake_case', () => {
      expect(
        SaleMapper.toUpdateRequestDto({
          idUsuario: 3,
          idMetodoPago: 2,
          total: 99.5,
          fecha: '2025-01-15T10:00:00Z',
        }),
      ).toEqual({
        id_usuario: 3,
        id_metodo_pago: 2,
        total: 99.5,
        fecha: '2025-01-15T10:00:00Z',
      });
    });

    // Verifica que los campos ausentes no viajen en el JSON (undefined se descarta al serializar).
    it('los campos no enviados no aparecen en el JSON', () => {
      const result = SaleMapper.toUpdateRequestDto({ total: 50 });

      expect(JSON.parse(JSON.stringify(result))).toEqual({ total: 50 });
    });

    // Verifica que null explícito en usuario y método de pago se conserve (desasignar).
    it('conserva null explícito en idUsuario e idMetodoPago', () => {
      const json = JSON.parse(JSON.stringify(SaleMapper.toUpdateRequestDto({ idUsuario: null, idMetodoPago: null })));

      expect(json).toEqual({ id_usuario: null, id_metodo_pago: null });
    });

    // Verifica que total 0 se envíe (no se confunda con ausente).
    it('conserva total 0', () => {
      expect(JSON.parse(JSON.stringify(SaleMapper.toUpdateRequestDto({ total: 0 })))).toEqual({ total: 0 });
    });

    // Verifica que un payload vacío produzca un JSON vacío.
    it('payload vacío produce JSON vacío', () => {
      expect(JSON.parse(JSON.stringify(SaleMapper.toUpdateRequestDto({})))).toEqual({});
    });
  });
});
