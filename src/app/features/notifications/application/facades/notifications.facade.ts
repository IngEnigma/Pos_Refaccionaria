import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, of, tap } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { Notification } from '@features/notifications/domain/entities/notification.entity';
import { GetNotificationsUseCase } from '@features/notifications/application/usecase/get-notifications.usecase';
import { MarkNotificationReadUseCase } from '@features/notifications/application/usecase/mark-notification-read.usecase';
import { MarkAllNotificationsReadUseCase } from '@features/notifications/application/usecase/mark-all-notifications-read.usecase';
import { DeleteNotificationUseCase } from '@features/notifications/application/usecase/delete-notification.usecase';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade {
  private readonly getNotificationsUseCase = inject(GetNotificationsUseCase);
  private readonly markNotificationReadUseCase = inject(MarkNotificationReadUseCase);
  private readonly markAllNotificationsReadUseCase = inject(MarkAllNotificationsReadUseCase);
  private readonly deleteNotificationUseCase = inject(DeleteNotificationUseCase);
  private readonly logger = inject(LoggerService).withContext('NotificationsFacade');

  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() => this._notifications().filter((n) => !n.leida).length);
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();

  loadNotifications(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.getNotificationsUseCase
      .execute()
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load notifications', { message });
          return of([]);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((notifications) => {
        this._notifications.set(notifications);
      });
  }

  markAsRead(id: number): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.markNotificationReadUseCase
      .execute(id)
      .pipe(
        tap(() => {
          this._notifications.update((current) =>
            current.map((n) => (n.id === id ? { ...n, leida: true } : n)),
          );
        }),
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to mark notification as read', { message, id });
          return of(undefined);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  markAllAsRead(): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.markAllNotificationsReadUseCase
      .execute()
      .pipe(
        tap(() => {
          this._notifications.update((current) =>
            current.map((n) => ({ ...n, leida: true })),
          );
        }),
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to mark all notifications as read', { message });
          return of(undefined);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  deleteNotification(id: number): void {
    this._loading.set(true);
    this._errorMessage.set(null);

    this.deleteNotificationUseCase
      .execute(id)
      .pipe(
        tap(() => {
          this._notifications.update((current) => current.filter((n) => n.id !== id));
        }),
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to delete notification', { message, id });
          return of(undefined);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'No fue posible procesar la notificación.';
  }
}
