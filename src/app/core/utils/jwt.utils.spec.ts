import { JwtUtils } from './jwt.utils';

describe('JwtUtils', () => {
  function base64Url(value: string): string {
    return btoa(value)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  function buildToken(payload: object): string {
    const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = base64Url(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  }

  it('decodes exp from base64url JWT payload', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = buildToken({ exp });

    expect(JwtUtils.decodeExpiration(token)).toBe(exp);
  });

  it('decodes exp when payload uses numeric string', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = buildToken({ exp: String(exp) });

    expect(JwtUtils.decodeExpiration(token)).toBe(exp);
  });

  it('returns 0 when token payload is invalid', () => {
    expect(JwtUtils.decodeExpiration('invalid-token')).toBe(0);
  });
});
