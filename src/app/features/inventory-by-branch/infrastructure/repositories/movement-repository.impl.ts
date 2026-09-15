import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { MovementResponseDto, RegisterMovementRequestDto } from '../../application/dtos/movement-response.dto';
import { InventoryMovement, RegisterMovementPayload } from '../../domain/entities/inventory-movement.entity';
import { InventoryMovementRepository } from '../../domain/repository/movement-repository';
import { MovementMapper } from '../mappers/movement.mapper';

@Injectable({ providedIn: 'root' })
export class InventoryMovementRepositoryImpl implements InventoryMovementRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly movementsEndpoint = `${this.env.apiUrl}/movimientos-inventario/`;
  private readonly detailsEndpoint = `${this.env.apiUrl}/detalles-inventario/bulk/`;

  getMovements(): Observable<InventoryMovement[]> {
    return this.http
      .get<MovementResponseDto[]>(this.movementsEndpoint)
      .pipe(map((dtos) => dtos.map((dto) => MovementMapper.fromResponseDto(dto))));
  }

  registerEntryExit(payload: RegisterMovementPayload): Observable<unknown> {
    const requestDto = MovementMapper.toRegisterRequestDto(payload);
    return this.http.post<unknown>(this.detailsEndpoint, requestDto);
  }
}
