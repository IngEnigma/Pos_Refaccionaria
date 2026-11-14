import { UserResponseDto } from '@features/users/application/dtos/user-response.dto';
import {
  CreateUserPayload,
  UpdateUserPayload,
} from '@features/users/domain/repository/user-repository';
import { UserMapper } from './user.mapper';

describe('UserMapper', () => {
  describe('fromResponseDto', () => {
    it('convierte is_active del backend a isActive de la entidad', () => {
      const dto: UserResponseDto = { id: 1, username: 'ana', email: 'ana@trt.com', is_active: true };

      expect(UserMapper.fromResponseDto(dto)).toEqual({
        id: 1,
        username: 'ana',
        email: 'ana@trt.com',
        isActive: true,
      });
    });

    it('conserva isActive en false para un usuario inactivo', () => {
      const dto: UserResponseDto = { id: 2, username: 'beto', email: 'beto@trt.com', is_active: false };

      expect(UserMapper.fromResponseDto(dto).isActive).toBe(false);
    });

    it('no expone la contraseña aunque el backend la incluyera en la respuesta', () => {
      const dto = {
        id: 3,
        username: 'caro',
        email: 'caro@trt.com',
        is_active: true,
        password: 'hash',
      } as UserResponseDto;

      expect(UserMapper.fromResponseDto(dto)).not.toHaveProperty('password');
    });
  });

  describe('toCreateRequestDto', () => {
    it('convierte isActive a is_active y conserva el resto de campos', () => {
      const payload: CreateUserPayload = {
        username: 'ana',
        password: 'secreta123',
        email: 'ana@trt.com',
        isActive: false,
      };

      expect(UserMapper.toCreateRequestDto(payload)).toEqual({
        username: 'ana',
        password: 'secreta123',
        email: 'ana@trt.com',
        is_active: false,
      });
    });
  });

  describe('toUpdateRequestDto', () => {
    it('convierte todos los campos informados', () => {
      const payload: UpdateUserPayload = {
        username: 'ana2',
        password: 'nueva',
        email: 'ana2@trt.com',
        isActive: true,
      };

      expect(UserMapper.toUpdateRequestDto(payload)).toEqual({
        username: 'ana2',
        password: 'nueva',
        email: 'ana2@trt.com',
        is_active: true,
      });
    });

    it('omite en el JSON los campos opcionales no informados', () => {
      const dto = UserMapper.toUpdateRequestDto({ email: 'solo@trt.com' });

      expect(JSON.parse(JSON.stringify(dto))).toEqual({ email: 'solo@trt.com' });
    });

    it('conserva is_active en false al desactivar (no lo confunde con ausente)', () => {
      const dto = UserMapper.toUpdateRequestDto({ isActive: false });

      expect(JSON.parse(JSON.stringify(dto))).toEqual({ is_active: false });
    });

    it('devuelve un DTO sin valores definidos si el payload viene vacío', () => {
      const dto = UserMapper.toUpdateRequestDto({});

      expect(JSON.parse(JSON.stringify(dto))).toEqual({});
    });
  });

  it('ida y vuelta: respuesta -> entidad -> payload de creación conserva los datos', () => {
    const dto: UserResponseDto = { id: 9, username: 'dani', email: 'dani@trt.com', is_active: true };
    const user = UserMapper.fromResponseDto(dto);

    const request = UserMapper.toCreateRequestDto({ ...user, password: 'x' });

    expect(request).toEqual({
      username: dto.username,
      password: 'x',
      email: dto.email,
      is_active: dto.is_active,
    });
  });
});
