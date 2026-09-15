import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { Notification } from '@features/notifications/domain/entities/notification.entity';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, DatePipe],
  templateUrl: './notification-item.component.html',
  styleUrls: ['./notification-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationItemComponent {
  readonly notification = input.required<Notification>();

  readonly markAsRead = output<number>();
  readonly deleteNotification = output<number>();

  private readonly typeConfig: Record<
    Notification['tipo'],
    { icon: string; colorClass: string }
  > = {
    info: { icon: 'Info', colorClass: 'type-info' },
    warning: { icon: 'TriangleAlert', colorClass: 'type-warning' },
    error: { icon: 'OctagonX', colorClass: 'type-error' },
    success: { icon: 'CircleCheck', colorClass: 'type-success' },
  };

  get icon(): string {
    return this.typeConfig[this.notification().tipo].icon;
  }

  get colorClass(): string {
    return this.typeConfig[this.notification().tipo].colorClass;
  }

  onMarkAsRead(event: Event): void {
    event.stopPropagation();
    this.markAsRead.emit(this.notification().id);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteNotification.emit(this.notification().id);
  }
}
