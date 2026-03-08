import { UserCreateRequestDto } from '@features/users/application/dtos/user-create-request.dto';
import { UserResponseDto } from '@features/users/application/dtos/user-response.dto';
import { UserUpdateRequestDto } from '@features/users/application/dtos/user-update-request.dto';
import { User } from '@features/users/domain/entities/user.entity';
import {
  CreateUserPayload,
  UpdateUserPayload,
} from '@features/users/domain/repository/user-repository';

export class UserMapper {
  static fromResponseDto(dto: UserResponseDto): User {
    return {
      id: dto.id,
      username: dto.username,
      email: dto.email,
      isActive: dto.is_active,
    };
  }

  static toCreateRequestDto(payload: CreateUserPayload): UserCreateRequestDto {
    return {
      username: payload.username,
      password: payload.password,
      email: payload.email,
      is_active: payload.isActive,
    };
  }

  static toUpdateRequestDto(payload: UpdateUserPayload): UserUpdateRequestDto {
    return {
      username: payload.username,
      password: payload.password,
      email: payload.email,
      is_active: payload.isActive,
    };
  }
}
