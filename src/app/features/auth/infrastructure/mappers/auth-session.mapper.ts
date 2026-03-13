import { JwtUtils } from '@core/utils/jwt.utils';
import { LoginResponseDto } from '@features/auth/application/dtos/auth-login-response.dto';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { mapAuthUserRole } from './auth-role.mapper';

export interface SessionPrimitives {
  accessToken: string;
  refreshToken: string | null;
  accessExp: number;
  refreshExp: number;
  userId: string;
  role: UserRole;
}

type LegacySessionPrimitives = Omit<SessionPrimitives, 'accessExp'> & {
  accesExp?: number;
};

export class SessionMapper {
  static fromJSON(json: SessionPrimitives | LegacySessionPrimitives): Session {
    const accessExp =
      'accessExp' in json ? json.accessExp : (json.accesExp ?? 0);

    return new Session(
      json.accessToken,
      json.refreshToken,
      accessExp,
      json.refreshExp,
      json.userId,
      json.role,
    );
  }

  static toJSON(session: Session): SessionPrimitives {
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      accessExp: session.accessExp,
      refreshExp: session.refreshExp,
      userId: session.userId,
      role: session.role,
    };
  }

  static fromLoginResponse(dto: LoginResponseDto): Session {
    const accessToken = dto.accessToken ?? dto.access ?? '';
    const refreshToken = dto.refreshToken ?? dto.refresh ?? null;
    const role = mapAuthUserRole(dto.user.isAdmin, dto.user.isStaff);
    const accessExp = JwtUtils.decodeExpiration(accessToken);
    const refreshExp = refreshToken ? JwtUtils.decodeExpiration(refreshToken) : 0;

    return new Session(
      accessToken,
      refreshToken,
      accessExp,
      refreshExp,
      String(dto.user.id),
      role,
    );
  }
}
