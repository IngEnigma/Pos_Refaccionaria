import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

import { DropdownComponent } from '@shared/ui/components/dropdown/dropdown.component';
import { DropdownTriggerDirective } from '@shared/ui/components/dropdown/dropdown-trigger.directive';
import { DropdownMenuComponent } from '@shared/ui/components/dropdown/dropdown-menu.component';
import { DropdownItemComponent } from '@shared/ui/components/dropdown/dropdown-item.component';
import { IconButtonComponent } from '@shared/ui/components/icon-button/icon-button.component';
import { NotificationsFacade } from '@features/notifications/application/facades/notifications.facade';
import { NotificationItemComponent } from '../notification-item/notification-item.component';

@Component({
  selector: 'app-notifications-badge',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    DropdownComponent,
    DropdownTriggerDirective,
    DropdownMenuComponent,
    DropdownItemComponent,
    IconButtonComponent,
    NotificationItemComponent,
  ],
  templateUrl: './notifications-badge.component.html',
  styleUrls: ['./notifications-badge.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsBadgeComponent implements OnInit {
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
