import { ProfileResponseDto } from '@features/auth/infrastructure/dtos/profile.dto';
import { ProfileMapper } from './profile.mapper';

describe('ProfileMapper', () => {
  describe('fromDto', () => {
    it('mapea snake_case del backend a camelCase del dominio', () => {
      const dto: ProfileResponseDto = { id: 1, id_usuario: 7, id_sucursal: 3 };

      expect(ProfileMapper.fromDto(dto)).toEqual({
        id: 1,
        idUsuario: 7,
        idSucursal: 3,
      });
    });

    it('conserva id_sucursal nulo (usuario sin sucursal asignada)', () => {
      const dto: ProfileResponseDto = { id: 1, id_usuario: 7, id_sucursal: null };

      expect(ProfileMapper.fromDto(dto).idSucursal).toBeNull();
    });

    it('no arrastra campos extra del DTO', () => {
      const dto = { id: 1, id_usuario: 7, id_sucursal: 3, extra: 'x' } as ProfileResponseDto;

      expect(Object.keys(ProfileMapper.fromDto(dto)).sort()).toEqual([
        'id',
        'idSucursal',
        'idUsuario',
      ]);
    });
  });
});
