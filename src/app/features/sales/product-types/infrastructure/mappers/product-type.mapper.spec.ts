import { ProductTypeMapper } from './product-type.mapper';

describe('ProductTypeMapper', () => {
  describe('fromResponseDto', () => {
    // Verifica que el DTO se mapee a la entidad conservando id y nombre.
    it('mapea el DTO a ProductType', () => {
      expect(ProductTypeMapper.fromResponseDto({ id: 4, nombre: 'Frenos' })).toEqual({ id: 4, nombre: 'Frenos' });
    });

    // Verifica que un nombre vacío se conserve tal cual (sin validación en el mapper).
    it('conserva nombre vacío', () => {
      expect(ProductTypeMapper.fromResponseDto({ id: 5, nombre: '' }).nombre).toBe('');
    });

    // Verifica que los campos extra del backend no se filtren a la entidad.
    it('ignora campos extra del DTO', () => {
      const dto = { id: 6, nombre: 'Motor', extra: 'x' } as unknown as { id: number; nombre: string };

      expect(ProductTypeMapper.fromResponseDto(dto)).toEqual({ id: 6, nombre: 'Motor' });
    });
  });

  describe('toCreateRequestDto', () => {
    // Verifica que el payload de creación se mapee con el nombre.
    it('mapea el nombre', () => {
      expect(ProductTypeMapper.toCreateRequestDto({ nombre: 'Suspensión' })).toEqual({ nombre: 'Suspensión' });
    });
  });

  describe('toUpdateRequestDto', () => {
    // Verifica que el payload de actualización con nombre se mapee tal cual.
    it('mapea el nombre', () => {
      expect(ProductTypeMapper.toUpdateRequestDto({ nombre: 'Eléctrico' })).toEqual({ nombre: 'Eléctrico' });
    });

    // Verifica que un payload sin nombre no envíe valor al serializar (undefined se descarta en JSON).
    it('sin nombre no envía valor en el JSON', () => {
      expect(JSON.parse(JSON.stringify(ProductTypeMapper.toUpdateRequestDto({})))).toEqual({});
    });
  });
});
