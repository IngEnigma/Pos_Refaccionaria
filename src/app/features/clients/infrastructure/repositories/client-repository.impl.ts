import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { ClientResponseDto } from '@features/clients/application/dtos/client-response.dto';
import { Client } from '@features/clients/domain/entities/client.entity';
import {
  ClientRepository,
  CreateClientPayload,
  UpdateClientPayload,
} from '@features/clients/domain/repository/client-repository';
import { ClientMapper } from '@features/clients/infrastructure/mappers/client.mapper';

@Injectable({ providedIn: 'root' })
export class ClientRepositoryImpl implements ClientRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/clientes`;

  getClients(): Observable<Client[]> {
    return this.http.get<ClientResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => ClientMapper.fromResponseDto(dto))),
    );
  }

  createClient(payload: CreateClientPayload): Observable<Client> {
    return this.http
      .post<ClientResponseDto>(this.endpoint, ClientMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => ClientMapper.fromResponseDto(dto)));
  }

  updateClient(id: number, payload: UpdateClientPayload): Observable<Client> {
    return this.http
      .put<ClientResponseDto>(`${this.endpoint}/${id}`, ClientMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => ClientMapper.fromResponseDto(dto)));
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
