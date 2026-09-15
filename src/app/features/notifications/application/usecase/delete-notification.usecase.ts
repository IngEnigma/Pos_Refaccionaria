import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { NotificationRepository } from '@features/notifications/domain/repository/notification-repository';

@Injectable({ providedIn: 'root' })
export class DeleteNotificationUseCase {
  private readonly repository = inject(NotificationRepository);

  execute(id: number): Observable<void> {
    return this.repository.delete(id);
  }
}
