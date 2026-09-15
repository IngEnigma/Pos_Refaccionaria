import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { BranchResponseDto } from '@features/branches/application/dtos/branch-response.dto';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  BranchRepository,
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';
import { BranchMapper } from '@features/branches/infrastructure/mappers/branch.mapper';

@Injectable({ providedIn: 'root' })
export class BranchRepositoryImpl implements BranchRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/sucursales`;

  getBranches(): Observable<Branch[]> {
    return this.http.get<BranchResponseDto[]>(this.endpoint).pipe(
      map((response) => response.map((dto) => BranchMapper.fromResponseDto(dto))),
    );
  }

  getById(id: number): Observable<Branch> {
    return this.http
      .get<BranchResponseDto>(`${this.endpoint}/${id}`)
      .pipe(map((dto) => BranchMapper.fromResponseDto(dto)));
  }

  create(payload: CreateBranchPayload): Observable<Branch> {
    return this.http
      .post<BranchResponseDto>(this.endpoint, BranchMapper.toCreateRequestDto(payload))
      .pipe(map((dto) => BranchMapper.fromResponseDto(dto)));
  }

  update(id: number, payload: UpdateBranchPayload): Observable<Branch> {
    return this.http
      .put<BranchResponseDto>(`${this.endpoint}/${id}`, BranchMapper.toUpdateRequestDto(payload))
      .pipe(map((dto) => BranchMapper.fromResponseDto(dto)));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
