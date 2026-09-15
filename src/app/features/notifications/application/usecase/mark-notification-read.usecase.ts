import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { NotificationRepository } from '@features/notifications/domain/repository/notification-repository';

@Injectable({ providedIn: 'root' })
export class MarkNotificationReadUseCase {
  private readonly repository = inject(NotificationRepository);

  execute(id: number): Observable<void> {
    return this.repository.markAsRead(id);
  }
}
