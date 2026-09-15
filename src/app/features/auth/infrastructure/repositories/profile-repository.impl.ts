import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';

import { ProfileRepository } from '@features/auth/domain/repository/profile-repository';
import { UserProfile } from '@features/auth/domain/entities/user-profile.entity';
import { ProfileMapper } from '@features/auth/infrastructure/mappers/profile.mapper';
import { ProfileResponseDto, UpdateSucursalRequestDto } from '@features/auth/infrastructure/dtos/profile.dto';
import { environment } from '@env/environment';

@Injectable()
export class ProfileRepositoryImpl implements ProfileRepository {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getMyProfile(): Observable<UserProfile> {
    return this.http
      .get<ProfileResponseDto>(`${this.apiUrl}/perfil/`)
      .pipe(map(ProfileMapper.fromDto));
  }

  updateMySucursal(idSucursal: number | null): Observable<UserProfile> {
    const payload: UpdateSucursalRequestDto = { id_sucursal: idSucursal };
    return this.http
      .put<ProfileResponseDto>(`${this.apiUrl}/perfil/`, payload)
      .pipe(map(ProfileMapper.fromDto));
  }
}
