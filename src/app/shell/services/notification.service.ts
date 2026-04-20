import { Injectable, Signal, signal } from '@angular/core';
import { NotificationPort } from '@shell/application/ports/notification.port';
import { NotificationItem } from '@shell/models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService implements NotificationPort {
  private readonly _notifications = signal<NotificationItem[]>([]);

  readonly notifications: Signal<NotificationItem[]> =
    this._notifications.asReadonly();

  add(notification: NotificationItem): void {
    this._notifications.update((current) => [
      ...current,
      { ...notification, read: notification.read ?? false },
    ]);
  }

  dismiss(id: number): void {
    this._notifications.update((current) =>
      current.filter((notification) => notification.id !== id),
    );
  }

  markAsRead(id: number): void {
    this._notifications.update((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }

  clear(): void {
    this._notifications.set([]);
  }
}
