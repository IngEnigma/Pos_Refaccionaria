import {
  AuthError,
  InvalidCredentialsError,
  NetworkAuthError,
  UnknownAuthError,
} from './auth.errors';

describe('auth.errors', () => {
  it.each([
    [InvalidCredentialsError, 'InvalidCredentialsError', 'Credenciales inválidas'],
    [NetworkAuthError, 'NetworkAuthError', 'Error de red'],
    [UnknownAuthError, 'UnknownAuthError', 'Error desconocido'],
  ])('%p: nombre, mensaje por defecto y jerarquía', (ErrorClass, name, defaultMessage) => {
    const error = new ErrorClass();

    expect(error.name).toBe(name);
    expect(error.message).toBe(defaultMessage);
    expect(error).toBeInstanceOf(AuthError);
    expect(error).toBeInstanceOf(Error);
  });

  it.each([InvalidCredentialsError, NetworkAuthError, UnknownAuthError])(
    '%p acepta un mensaje propio',
    (ErrorClass) => {
      expect(new ErrorClass('otro').message).toBe('otro');
    },
  );

  it('AuthError exige mensaje y se nombra AuthError', () => {
    const error = new AuthError('x');

    expect(error.name).toBe('AuthError');
    expect(error.message).toBe('x');
  });
});
