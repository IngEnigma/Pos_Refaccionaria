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

  // H-46: `user.rol` del login define los permisos en el backend; tiene prioridad sobre las banderas.
  it.each([
    { rol: 'cajero', isAdmin: true, isStaff: true, expected: UserRole.Seller },
    { rol: 'encargado', isAdmin: false, isStaff: false, expected: UserRole.Manager },
    { rol: 'admin', isAdmin: false, isStaff: true, expected: UserRole.Admin },
  ])('H-46: rol=$rol manda sobre isAdmin=$isAdmin isStaff=$isStaff → $expected', ({ rol, isAdmin, isStaff, expected }) => {
    expect(mapAuthUserRole(isAdmin, isStaff, rol)).toBe(expected);
  });

  it.each([[undefined], [null], [''], ['desconocido']])('H-46: sin rol reconocible (%p) cae a isAdmin/isStaff', (rol) => {
    expect(mapAuthUserRole(true, true, rol as string | undefined)).toBe(UserRole.Admin);
    expect(mapAuthUserRole(false, false, rol as string | undefined)).toBe(UserRole.Seller);
  });
});
