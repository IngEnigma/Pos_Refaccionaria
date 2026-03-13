import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';

export function mapAuthUserRole(
  isAdmin: boolean,
  isStaff: boolean,
): UserRole {
  if (isAdmin && isStaff) {
    return UserRole.Admin;
  }
  if (!isAdmin && isStaff) {
    return UserRole.Manager;
  }
  return UserRole.Seller;
}
