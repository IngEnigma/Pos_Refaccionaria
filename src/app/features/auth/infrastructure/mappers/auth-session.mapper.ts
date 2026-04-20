import { JwtUtils } from '@core/utils/jwt.utils';
import { LoginResponseDto } from '@features/auth/infrastructure/dtos/auth-login-response.dto';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { mapAuthUserRole } from './auth-role.mapper';

export class SessionMapper {

  static fromLoginResponse(response: LoginResponseDto): Session {
    const { accessToken, refreshToken } = this.normalizeResponse(response);

    const role = mapAuthUserRole(response.user.isAdmin, response.user.isStaff);
    const accessExp = JwtUtils.decodeExpiration(accessToken);
    const refreshExp = refreshToken ? JwtUtils.decodeExpiration(refreshToken) : 0;

    return new Session(
      accessToken,
      refreshToken,
      accessExp,
      refreshExp,
      String(response.user.id),
      role,
      response.user.username,
    );
  }

  private static normalizeResponse(response: any): { accessToken: string; refreshToken: string | null } {
    return {
      accessToken: response.accessToken ?? response.access ?? '',
      refreshToken: response.refreshToken ?? response.refresh ?? null,
    };
  }
}
