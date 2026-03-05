import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';

export class Session {
  constructor(
    public readonly accessToken: string,
    public readonly refreshToken: string | null,
    public readonly accessExp: number,
    public readonly refreshExp: number,
    public readonly userId: string,
    public readonly role: UserRole,
  ) {}

  get isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }

  get isManager(): boolean {
    return this.role === UserRole.Manager;
  }

  get isSeller(): boolean {
    return this.role === UserRole.Seller;
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
    );
  }

  isAccessTokenExpired(): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    return this.accessExp < currentTime;
  }

  isRefreshTokenExpired(): boolean {
    if (!this.refreshToken) return true;
    const currentTime = Math.floor(Date.now() / 1000);
    return this.refreshExp < currentTime;
  }

}
