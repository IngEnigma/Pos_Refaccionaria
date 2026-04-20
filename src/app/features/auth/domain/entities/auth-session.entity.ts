import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';

export interface SessionPrimitives {
  accessToken: string;
  refreshToken: string | null;
  accessExp: number;
  refreshExp: number;
  userId: string;
  role: UserRole;
  username: string;
}

export type LegacySessionPrimitives = Omit<SessionPrimitives, 'accessExp'> & {
  accesExp?: number;
};

export class Session {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string | null,
    public readonly accessExp: number,
    public readonly refreshExp: number,
    public readonly userId: string,
    public readonly role: UserRole,
    public readonly username: string,
  ) {}

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  get isAuthenticated(): boolean {
    return !this.isAccessTokenExpired();
  }

  updateAccessToken(newAccess: string, newAccessExp: number): Session {
    return new Session(
      newAccess,
      this.refreshToken,
      newAccessExp,
      this.refreshExp,
      this.userId,
      this.role,
      this.username,
    );
  }

  isAccessTokenExpired(): boolean {
    if (!this.accessToken) {
      return true;
    }

    if (!this.accessExp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return this.accessExp < currentTime;
  }

  isRefreshTokenExpired(): boolean {
    if (!this.refreshToken) return true;

    if (!this.refreshExp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return this.refreshExp < currentTime;
  }

  static fromPrimitives(primitives: SessionPrimitives | LegacySessionPrimitives): Session {
    const accessExp = 'accessExp' in primitives ? primitives.accessExp : (primitives.accesExp ?? 0);

    return new Session(
      primitives.accessToken,
      primitives.refreshToken,
      accessExp,
      primitives.refreshExp,
      primitives.userId,
      primitives.role,
      primitives.username || '',
    );
  }

  toPrimitives(): SessionPrimitives {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      accessExp: this.accessExp,
      refreshExp: this.refreshExp,
      userId: this.userId,
      role: this.role,
      username: this.username,
    };
  }
}
