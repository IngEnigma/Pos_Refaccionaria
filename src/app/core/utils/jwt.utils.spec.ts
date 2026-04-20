import { JwtUtils } from './jwt.utils';

describe('JwtUtils', () => {
  describe('decodeExpiration', () => {
    it('should return expiration for a valid JWT', () => {
      // payload: {"exp": 1700000000}
      const token = 'header.eyJleHAiOjE3MDAwMDAwMDB9.signature';
      expect(JwtUtils.decodeExpiration(token)).toBe(1700000000);
    });

    it('should return 0 for an invalid token format (no payload)', () => {
      const token = 'invalidtokenwithoutdots';
      expect(JwtUtils.decodeExpiration(token)).toBe(0);
    });

    it('should return 0 when payload does not have exp', () => {
      // payload: {"sub": "1234567890", "name": "John Doe", "iat": 1516239022}
      const token = 'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.signature';
      expect(JwtUtils.decodeExpiration(token)).toBe(0);
    });

    it('should handle exp as string and return converted number', () => {
      // payload: {"exp": "1700000000"}
      const token = 'header.eyJleHAiOiIxNzAwMDAwMDAwIn0.signature';
      expect(JwtUtils.decodeExpiration(token)).toBe(1700000000);
    });

    it('should return 0 if exp is an invalid string', () => {
      // payload: {"exp": "invalid"}
      const token = 'header.eyJleHAiOiJpbnZhbGlkIn0.signature';
      expect(JwtUtils.decodeExpiration(token)).toBe(0);
    });

    it('should return 0 if token is structurally invalid base64', () => {
      const token = 'header.invalid-base64!.signature';
      expect(JwtUtils.decodeExpiration(token)).toBe(0);
    });
  });
});
