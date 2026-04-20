import { SessionMapper } from './auth-session.mapper';
import { LoginResponseDto } from '../dtos/auth-login-response.dto';
import { UserRole } from '@features/auth/domain/value-objects/auth-user-role.enum';
import { JwtUtils } from '@core/utils/jwt.utils';

jest.mock('@core/utils/jwt.utils');

describe('SessionMapper', () => {
  const mockDto: LoginResponseDto = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: {
      id: 1,
      username: 'testuser',
      isAdmin: true,
      isStaff: true,
    },
  };

  beforeEach(() => {
    (JwtUtils.decodeExpiration as jest.Mock).mockReturnValue(123456789);
  });

  describe('fromLoginResponse', () => {
    it('should map from standard property names (accessToken/refreshToken)', () => {
      const session = SessionMapper.fromLoginResponse(mockDto);

      expect(session.accessToken).toBe('access-token');
      expect(session.refreshToken).toBe('refresh-token');
      expect(session.userId).toBe('1');
      expect(session.username).toBe('testuser');
      expect(session.role).toBe(UserRole.Admin);
      expect(session.accessExp).toBe(123456789);
    });

    it('should map from legacy property names (access/refresh)', () => {
      const legacyDto: any = {
        access: 'legacy-access',
        refresh: 'legacy-refresh',
        user: mockDto.user,
      };

      const session = SessionMapper.fromLoginResponse(legacyDto as LoginResponseDto);

      expect(session.accessToken).toBe('legacy-access');
      expect(session.refreshToken).toBe('legacy-refresh');
    });

    it('should handle missing refresh token', () => {
      const noRefreshDto: LoginResponseDto = {
        ...mockDto,
        refreshToken: undefined,
      };

      const session = SessionMapper.fromLoginResponse(noRefreshDto);

      expect(session.refreshToken).toBeNull();
      expect(session.refreshExp).toBe(0);
    });
  });
});
