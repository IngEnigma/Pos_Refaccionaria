import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { NotificationResponseDto } from '@features/notifications/application/dtos/notification-response.dto';
import { Notification } from '@features/notifications/domain/entities/notification.entity';
import { NotificationRepository } from '@features/notifications/domain/repository/notification-repository';
import { NotificationMapper } from '@features/notifications/infrastructure/mappers/notification.mapper';

@Injectable({ providedIn: 'root' })
export class NotificationRepositoryImpl implements NotificationRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/notifications`;

  getNotifications(): Observable<Notification[]> {
    return this.http
      .get<NotificationResponseDto[]>(`${this.endpoint}/`)
      .pipe(map((dtos) => dtos.map((dto) => NotificationMapper.fromResponseDto(dto))));
  }

  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.endpoint}/${id}/`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.endpoint}/mark-all/`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}/`);
  }
}
