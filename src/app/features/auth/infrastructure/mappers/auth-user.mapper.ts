import { User } from '@features/auth/domain/entities/auth-user.entity';
import { LoginResponseDto } from '@features/auth/application/dtos/auth-login-response.dto';
import { mapAuthUserRole } from './auth-role.mapper';

export class UserMapper {
  static fromLoginResponse(dto: LoginResponseDto): User {
    const role = mapAuthUserRole(dto.user.isAdmin, dto.user.isStaff);

    return new User(
      String(dto.user.id),
      role
    );
  }
}
