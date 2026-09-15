import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { withoutTrailingSlash } from '@core/interceptors/trailing-slash.interceptor';
import { Environment } from '@env/environment.model';
import { UserResponseDto } from '@features/users/application/dtos/user-response.dto';
import { User } from '@features/users/domain/entities/user.entity';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserRepository,
} from '@features/users/domain/repository/user-repository';
import { UserMapper } from '@features/users/infrastructure/mappers/user.mapper';

@Injectable({ providedIn: 'root' })
export class UserRepositoryImpl implements UserRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/users`;

  // El backend define `users` y `users/<id>` sin slash final (ver usuario/urls.py):
  // sin el bypass, el interceptor los convierte en `.../users/` y Django responde 404.
  getUsers(): Observable<User[]> {
    return this.http.get<UserResponseDto[]>(this.endpoint, { context: withoutTrailingSlash() }).pipe(
      map((response) => response.map((dto) => UserMapper.fromResponseDto(dto))),
    );
  }

  createUser(payload: CreateUserPayload): Observable<User> {
    return this.http
      .post<UserResponseDto>(this.endpoint, UserMapper.toCreateRequestDto(payload), { context: withoutTrailingSlash() })
      .pipe(map((dto) => UserMapper.fromResponseDto(dto)));
  }

  updateUser(id: number, payload: UpdateUserPayload): Observable<User> {
    return this.http
      .put<UserResponseDto>(`${this.endpoint}/${id}`, UserMapper.toUpdateRequestDto(payload), { context: withoutTrailingSlash() })
      .pipe(map((dto) => UserMapper.fromResponseDto(dto)));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`, { context: withoutTrailingSlash() });
  }
}
