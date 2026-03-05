import { User } from '@features/auth/domain/entities/auth-user.entity';
import { LoginResponseDto } from '@features/auth/application/dtos/auth-login-response.dto';
import { JwtUtils } from '@app/core/utils/jwt.utils';

export class UserMapper {
  static fromLoginResponse(dto: LoginResponseDto): User {
    const role = JwtUtils.mapRole(dto.user.isAdmin, dto.user.isStaff);

    return new User(
      dto.user.id,
      role
    );
  }
}
