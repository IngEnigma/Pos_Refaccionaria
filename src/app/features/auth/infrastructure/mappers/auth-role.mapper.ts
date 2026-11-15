import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';

const ROLE_BY_BACKEND_ROL: Record<string, UserRole> = {
  cajero: UserRole.Seller,
  encargado: UserRole.Manager,
  admin: UserRole.Admin,
};

/** `rol` (campo `user.rol` del login) manda; sin él se deduce de isadmin/isstaff. */
export function mapAuthUserRole(
  isAdmin: boolean,
  isStaff: boolean,
  rol?: string | null,
): UserRole {
  const fromRol = rol ? ROLE_BY_BACKEND_ROL[rol] : undefined;
  if (fromRol) return fromRol;

  if (isAdmin && isStaff) {
    return UserRole.Admin;
  }
  if (!isAdmin && isStaff) {
    return UserRole.Manager;
  }
  return UserRole.Seller;
}
