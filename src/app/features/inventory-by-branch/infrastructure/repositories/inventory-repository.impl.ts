import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { BranchInventoryDto, InventoryItemDto } from '../../application/dtos/inventory-response.dto';
import { InventarioRefDto, CreateInventarioRequestDto } from '../../application/dtos/inventario-ref.dto';
import { BranchInventory } from '../../domain/entities/inventory.entity';
import { InventarioRef } from '../../domain/entities/inventory-movement.entity';
import { InventoryRepository } from '../../domain/repository/inventory-repository';
import { InventoryMapper } from '../mappers/inventory.mapper';

@Injectable({ providedIn: 'root' })
export class InventoryRepositoryImpl implements InventoryRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/inventarios`;

  getMyBranchInventory(): Observable<BranchInventory[]> {
    return this.http
      .get<BranchInventoryDto[] | { results: BranchInventoryDto[] } | { detalles: InventoryItemDto[]; id_inventario: number; descripcion: string; id_sucursal: number } | { total: number; page: number; page_size: number; total_pages: number; results: BranchInventoryDto[] }>(`${this.endpoint}/mi-sucursal/`)
      .pipe(
        map((response: unknown) => {
          if (Array.isArray(response)) {
            return (response as BranchInventoryDto[]).map((dto) => InventoryMapper.fromBranchInventoryDto(dto));
          }
          const obj = response as Record<string, unknown>;
          if (obj && Array.isArray(obj['results'])) {
            return (obj['results'] as BranchInventoryDto[]).map((dto) => InventoryMapper.fromBranchInventoryDto(dto));
          }
          if (obj && Array.isArray(obj['detalles'])) {
            const single = obj as unknown as BranchInventoryDto;
            return [InventoryMapper.fromBranchInventoryDto(single)];
          }
          return [];
        }),
      );
  }

  getInventarios(): Observable<InventarioRef[]> {
    return this.http
      .get<InventarioRefDto[]>(this.endpoint)
      .pipe(map((dtos) => dtos.map((dto) => ({ id: dto.id, descripcion: dto.descripcion, idSucursal: dto.id_sucursal }))));
  }

  createInventario(payload: { idSucursal: number; descripcion: string }): Observable<InventarioRef> {
    return this.http
      .post<InventarioRefDto>(this.endpoint, {
        id_sucursal: payload.idSucursal,
        descripcion: payload.descripcion,
      } as CreateInventarioRequestDto)
      .pipe(map((dto) => ({ id: dto.id, descripcion: dto.descripcion, idSucursal: dto.id_sucursal })));
  }
}
