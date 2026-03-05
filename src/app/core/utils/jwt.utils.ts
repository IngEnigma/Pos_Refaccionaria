import { UserRole } from '@app/features/auth/domain/value-objects/auth-user-role.enum';

export class JwtUtils {
  static decodeExpiration(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return typeof payload.exp === 'number' ? payload.exp : 0;
    } catch {
      return 0;
    }
  }

  static mapRole(isAdmin: boolean, isStaff: boolean): UserRole {
    if (isAdmin && isStaff) {
      return UserRole.Admin;
    }
    if (!isAdmin && isStaff) {
      return UserRole.Manager;
    }
    return UserRole.Seller;
  }
}
