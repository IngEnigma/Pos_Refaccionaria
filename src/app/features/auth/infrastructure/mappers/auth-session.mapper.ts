import { JwtUtils } from '@app/core/utils/jwt.utils';
import { LoginResponseDto } from '@features/auth/application/dtos/auth-login-response.dto';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';

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
    const role = JwtUtils.mapRole(dto.user.isAdmin, dto.user.isStaff);
    const accessExp = JwtUtils.decodeExpiration(dto.accessToken);
    const refreshExp = JwtUtils.decodeExpiration(dto.refreshToken);

    return new Session(
      dto.accessToken,
      dto.refreshToken,
      accessExp,
      refreshExp,
      dto.user.id,
      role,
    );
  }
}
