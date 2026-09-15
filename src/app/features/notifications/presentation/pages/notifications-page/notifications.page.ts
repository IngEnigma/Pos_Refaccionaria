import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { NotificationsFacade } from '@features/notifications/application/facades/notifications.facade';
import { NotificationItemComponent } from '../../components/notification-item/notification-item.component';
import { ButtonComponent } from '@shared/ui/components/button/button.component';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    NotificationItemComponent,
    ButtonComponent,
  ],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent implements OnInit {
  readonly facade = inject(NotificationsFacade);

  ngOnInit(): void {
    this.facade.loadNotifications();
  }

  onMarkAsRead(id: number): void {
    this.facade.markAsRead(id);
  }

  onDelete(id: number): void {
    this.facade.deleteNotification(id);
  }

  onMarkAllAsRead(): void {
    this.facade.markAllAsRead();
  }
}
