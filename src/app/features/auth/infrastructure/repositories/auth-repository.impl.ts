import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '@app/core/config/api-endpints';
import { APP_ENV } from '@app/core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LoggerService } from '@app/core/logging/logger.service';
import { LoggerPort } from '@app/core/logging/logger.port';
import { LoginRequestDto } from '@features/auth/application/dtos/auth-login-request.dto';
import { LoginResponseDto } from '@features/auth/application/dtos/auth-login-response.dto';
import { RefreshTokenRequestDto } from '@features/auth/application/dtos/auth-refresh-token-request.dto';
import { RefreshTokenResponseDto } from '@features/auth/application/dtos/auth-refresh-token-response.dto';
import {
  AuthRepository,
  LoginCredentials,
} from '@features/auth/domain/repository/auth-repository';
import { Session } from '@features/auth/domain/entities/auth-session.entity';
import { SessionMapper } from '@features/auth/infrastructure/mappers/auth-session.mapper';

@Injectable({ providedIn: 'root' })
export class AuthRepositoryImpl implements AuthRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly logger: LoggerPort = inject(LoggerService).withContext(
    'AuthRepository',
  );

  login(credentials: LoginCredentials): Observable<Session> {
    const url = `${this.env.apiUrl}${API_ENDPOINTS.AUTH.LOGIN}`;
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
        return throwError(() => error);
      }),
    );
  }

  refresh(refreshToken: string): Observable<string> {
    const url = `${this.env.apiUrl}${API_ENDPOINTS.AUTH.REFRESH}`;
    const payload: RefreshTokenRequestDto = { refresh: refreshToken };

    return this.http.post<RefreshTokenResponseDto>(url, payload).pipe(
      map((dto) => dto.access),
      tap(() => {
        this.logger.debug('Refresh request succeeded', { url });
      }),
      catchError((error: unknown) => {
        this.logger.error('Refresh request failed', { url, error });
        return throwError(() => error);
      }),
    );
  }
}
