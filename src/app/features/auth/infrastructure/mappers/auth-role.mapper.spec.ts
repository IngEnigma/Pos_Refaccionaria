import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { mapAuthUserRole } from './auth-role.mapper';

describe('mapAuthUserRole', () => {
  it.each([
    { isAdmin: true, isStaff: true, expected: UserRole.Admin },
    { isAdmin: false, isStaff: true, expected: UserRole.Manager },
    { isAdmin: false, isStaff: false, expected: UserRole.Seller },
  ])(
    'isAdmin=$isAdmin isStaff=$isStaff → $expected',
    ({ isAdmin, isStaff, expected }) => {
      expect(mapAuthUserRole(isAdmin, isStaff)).toBe(expected);
    },
  );

  it('admin sin staff no eleva privilegios: queda como seller', () => {
    expect(mapAuthUserRole(true, false)).toBe(UserRole.Seller);
  });
});
