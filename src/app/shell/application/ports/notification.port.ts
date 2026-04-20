import { Signal } from '@angular/core';
import { NotificationItem } from '@shell/models/notification.model';

export abstract class NotificationPort {
  abstract readonly notifications: Signal<NotificationItem[]>;

  abstract add(notification: NotificationItem): void;
  abstract dismiss(id: number): void;
  abstract markAsRead(id: number): void;
  abstract clear(): void;
}
