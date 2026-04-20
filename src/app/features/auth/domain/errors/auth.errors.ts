export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message = 'Credenciales inválidas') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

export class NetworkAuthError extends AuthError {
  constructor(message = 'Error de red') {
    super(message);
    this.name = 'NetworkAuthError';
  }
}

export class UnknownAuthError extends AuthError {
  constructor(message = 'Error desconocido') {
    super(message);
    this.name = 'UnknownAuthError';
  }
}
