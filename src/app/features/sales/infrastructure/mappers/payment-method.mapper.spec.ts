import { PaymentMethodMapper } from './payment-method.mapper';

describe('PaymentMethodMapper', () => {
  describe('fromResponseDto', () => {
    // Verifica que el DTO se mapee a la entidad conservando id, tipo y descripción.
    it('mapea el DTO a PaymentMethod', () => {
      expect(
        PaymentMethodMapper.fromResponseDto({ id: 1, tipo: 'Efectivo', descripcion: 'Pago en caja' }),
      ).toEqual({ id: 1, tipo: 'Efectivo', descripcion: 'Pago en caja' });
    });

    // Verifica que una descripción vacía se conserve como string vacío.
    it('conserva descripción vacía', () => {
      expect(PaymentMethodMapper.fromResponseDto({ id: 2, tipo: 'Tarjeta', descripcion: '' }).descripcion).toBe('');
    });

    // Verifica que se devuelva un objeto nuevo y no el mismo DTO.
    it('devuelve un objeto nuevo, no el DTO', () => {
      const dto = { id: 3, tipo: 'Transferencia', descripcion: 'SPEI' };

      expect(PaymentMethodMapper.fromResponseDto(dto)).not.toBe(dto);
    });
  });

  describe('toCreateRequestDto', () => {
    // Verifica que el payload de creación se mapee con tipo y descripción.
    it('mapea tipo y descripcion', () => {
      expect(PaymentMethodMapper.toCreateRequestDto({ tipo: 'Cheque', descripcion: 'A 30 días' })).toEqual({
        tipo: 'Cheque',
        descripcion: 'A 30 días',
      });
    });
  });

  describe('toUpdateRequestDto', () => {
    // Verifica que un payload completo conserve ambos campos.
    it('incluye tipo y descripcion cuando vienen ambos', () => {
      expect(PaymentMethodMapper.toUpdateRequestDto({ tipo: 'Efectivo', descripcion: 'Caja' })).toEqual({
        tipo: 'Efectivo',
        descripcion: 'Caja',
      });
    });

    // Verifica que una actualización parcial solo incluya el campo enviado.
    it('solo incluye tipo si descripcion no viene', () => {
      const result = PaymentMethodMapper.toUpdateRequestDto({ tipo: 'Efectivo' });

      expect(Object.keys(result)).toEqual(['tipo']);
    });

    // Verifica que una actualización parcial solo incluya descripcion si tipo no viene.
    it('solo incluye descripcion si tipo no viene', () => {
      const result = PaymentMethodMapper.toUpdateRequestDto({ descripcion: 'Nueva' });

      expect(Object.keys(result)).toEqual(['descripcion']);
    });

    // Verifica que un string vacío se envíe (permite vaciar la descripción) y no se trate como ausente.
    it('incluye descripcion vacía como definida', () => {
      expect(PaymentMethodMapper.toUpdateRequestDto({ descripcion: '' })).toEqual({ descripcion: '' });
    });

    // Verifica que un payload vacío produzca un objeto vacío.
    it('payload vacío produce objeto vacío', () => {
      expect(PaymentMethodMapper.toUpdateRequestDto({})).toEqual({});
    });
  });
});
