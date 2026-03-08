import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { MovementResponseDto } from '@features/movements/application/dtos/movement-response.dto';
import { Movement } from '@features/movements/domain/entities/movement.entity';
import {
  CreateMovementPayload,
  MovementRepository,
  UpdateMovementPayload,
} from '@features/movements/domain/repository/movement-repository';
import { MovementMapper } from '@features/movements/infrastructure/mappers/movement.mapper';

@Injectable({ providedIn: 'root' })
export class MovementRepositoryImpl implements MovementRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/movimientos`;

  getMovements(): Observable<Movement[]> {
    return this.http.get<MovementResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => MovementMapper.fromResponseDto(dto))),
    );
  }

  createMovement(payload: CreateMovementPayload): Observable<Movement> {
    return this.http
      .post<MovementResponseDto>(this.endpoint, MovementMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => MovementMapper.fromResponseDto(dto)));
  }

  updateMovement(id: number, payload: UpdateMovementPayload): Observable<Movement> {
    return this.http
      .put<MovementResponseDto>(`${this.endpoint}/${id}`, MovementMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => MovementMapper.fromResponseDto(dto)));
  }

  deleteMovement(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
