import { UserRole } from '@app/features/auth/domain/value-objects/auth-user-role.enum';

export class JwtUtils {
  static decodeExpiration(token: string): number {
    try {
      const payloadPart = token.split('.')[1];

      if (!payloadPart) {
        return 0;
      }

      // JWT payload uses base64url. Convert it before decoding.
      const base64 = payloadPart
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(payloadPart.length / 4) * 4, '=');
      const payload = JSON.parse(atob(base64)) as { exp?: unknown };

      if (typeof payload.exp === 'number') {
        return payload.exp;
      }

      if (typeof payload.exp === 'string') {
        const parsed = Number(payload.exp);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      return 0;
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
