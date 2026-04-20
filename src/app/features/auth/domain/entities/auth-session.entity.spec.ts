import { Session } from './auth-session.entity';
import { UserRole } from '../value-objects/auth-user-role.enum';

describe('Session', () => {
  it('treats token as valid when exp is unavailable but token exists', () => {
    const session = new Session(
      'opaque-access-token',
      'opaque-refresh-token',
      0,
      0,
      'u-1',
      UserRole.Seller,
      'testuser'
    );

    expect(session.isAccessTokenExpired()).toBe(false);
    expect(session.isAuthenticated).toBe(true);
    expect(session.isRefreshTokenExpired()).toBe(false);
  });

  it('marks session as expired when access token is missing', () => {
    const session = new Session(
      '',
      'refresh',
      0,
      0,
      'u-1',
      UserRole.Seller,
      'testuser'
    );

    expect(session.isAccessTokenExpired()).toBe(true);
    expect(session.isAuthenticated).toBe(false);
  });

  describe('hasRole', () => {
    it('should return true if user has the role', () => {
      const session = new Session('a', 'r', 0, 0, 'u', UserRole.Admin, 'user');
      expect(session.hasRole(UserRole.Admin)).toBe(true);
    });

    it('should return false if user does NOT have the role', () => {
      const session = new Session('a', 'r', 0, 0, 'u', UserRole.Seller, 'user');
      expect(session.hasRole(UserRole.Admin)).toBe(false);
    });
  });
});
