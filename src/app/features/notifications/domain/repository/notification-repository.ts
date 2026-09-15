import { Observable } from 'rxjs';

import { Notification } from '@features/notifications/domain/entities/notification.entity';

export abstract class NotificationRepository {
  abstract getNotifications(): Observable<Notification[]>;
  abstract markAsRead(id: number): Observable<void>;
  abstract markAllAsRead(): Observable<void>;
  abstract delete(id: number): Observable<void>;
}
