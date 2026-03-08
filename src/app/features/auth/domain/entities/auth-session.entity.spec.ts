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
    );

    expect(session.isAccessTokenExpired()).toBeFalse();
    expect(session.isAuthenticated).toBeTrue();
    expect(session.isRefreshTokenExpired()).toBeFalse();
  });

  it('marks session as expired when access token is missing', () => {
    const session = new Session(
      '',
      'refresh',
      0,
      0,
      'u-1',
      UserRole.Seller,
    );

    expect(session.isAccessTokenExpired()).toBeTrue();
    expect(session.isAuthenticated).toBeFalse();
  });
});
