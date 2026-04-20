import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { AUTH_ENDPOINTS } from '@features/auth/config/auth-endpoints';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoginRequestDto } from '@features/auth/infrastructure/dtos/auth-login-request.dto';
import { LoginResponseDto } from '@features/auth/infrastructure/dtos/auth-login-response.dto';
import { RefreshTokenRequestDto } from '@features/auth/infrastructure/dtos/auth-refresh-token-request.dto';
import { RefreshTokenResponseDto } from '@features/auth/infrastructure/dtos/auth-refresh-token-response.dto';
import {
  AuthRepository,
  LoginCredentials,
} from '@features/auth/domain/repository/auth-repository';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { SessionMapper } from '@features/auth/infrastructure/mappers/auth-session.mapper';
import {
  InvalidCredentialsError,
  NetworkAuthError,
  UnknownAuthError,
} from '@features/auth/domain/errors/auth.errors';

@Injectable()
export class AuthRepositoryImpl implements AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly logger = inject(LOGGER_PORT).withContext('AuthRepository');

  login(credentials: LoginCredentials): Observable<Session> {
    const url = `${this.env.apiUrl}${AUTH_ENDPOINTS.LOGIN}`;
    const payload: LoginRequestDto = {
      username: credentials.username,
      password: credentials.password,
    };

    return this.http.post<LoginResponseDto>(url, payload).pipe(
      map((dto) => SessionMapper.fromLoginResponse(dto)),
      tap((session) => {
        this.logger.debug('Login request succeeded', { url, userId: session.userId });
      }),
      catchError((error: unknown) => {
        this.logger.error('Login request failed', { url, error });
        return throwError(() => this.mapHttpError(error));
      }),
    );
  }

  refresh(refreshToken: string): Observable<string> {
    const url = `${this.env.apiUrl}${AUTH_ENDPOINTS.REFRESH}`;
    const payload: RefreshTokenRequestDto = { refresh: refreshToken };

    return this.http.post<RefreshTokenResponseDto>(url, payload).pipe(
      map((dto) => dto.access),
      tap(() => {
        this.logger.debug('Refresh request succeeded', { url });
      }),
      catchError((error: unknown) => {
        this.logger.error('Refresh request failed', { url, error });
        return throwError(() => this.mapHttpError(error));
      }),
    );
  }

  private mapHttpError(error: unknown): Error {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return new InvalidCredentialsError();
      }
      if (error.status === 0) {
        return new NetworkAuthError();
      }

      const payload = error.error;
      if (payload && typeof payload === 'object') {
        if ('detail' in payload && typeof payload.detail === 'string') {
          return new UnknownAuthError(payload.detail);
        }
        if ('message' in payload && typeof payload.message === 'string') {
          return new UnknownAuthError(payload.message);
        }
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new UnknownAuthError();
  }
}
