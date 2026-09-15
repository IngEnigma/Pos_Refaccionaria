import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { NotificationRepository } from '@features/notifications/domain/repository/notification-repository';

@Injectable({ providedIn: 'root' })
export class MarkAllNotificationsReadUseCase {
  private readonly repository = inject(NotificationRepository);

  execute(): Observable<void> {
    return this.repository.markAllAsRead();
  }
}
