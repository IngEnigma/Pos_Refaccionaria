import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Notification } from '@features/notifications/domain/entities/notification.entity';
import { NotificationRepository } from '@features/notifications/domain/repository/notification-repository';

@Injectable({ providedIn: 'root' })
export class GetNotificationsUseCase {
  private readonly repository = inject(NotificationRepository);

  execute(): Observable<Notification[]> {
    return this.repository.getNotifications();
  }
}
