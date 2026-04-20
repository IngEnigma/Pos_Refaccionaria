import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { SearchInputComponent } from '@shared/ui/form-controls/search-input/search-input.component';
import { IconButtonComponent } from '@shared/ui/components/icon-button/icon-button.component';
import { DropdownComponent } from '@shared/ui/components/dropdown/dropdown.component';
import { DropdownTriggerDirective } from '@shared/ui/components/dropdown/dropdown-trigger.directive';
import { DropdownMenuComponent } from '@shared/ui/components/dropdown/dropdown-menu.component';
import { DropdownItemComponent } from '@shared/ui/components/dropdown/dropdown-item.component';
import { LucideAngularModule } from 'lucide-angular';
import { NotificationItem } from '@shell/models/notification.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    SearchInputComponent,
    IconButtonComponent,
    DropdownComponent,
    DropdownTriggerDirective,
    DropdownMenuComponent,
    DropdownItemComponent,
    LucideAngularModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly username = input.required<string>();
  readonly currentDate = input.required<string>();
  readonly profileIconPath = input('user');
  readonly notificationsIconPath = input('bell');
  readonly notifications = input<NotificationItem[]>([]);

  readonly logoutClick = output<void>();
  readonly searchChange = output<string>();

  onLogout(): void {
    this.logoutClick.emit();
  }

  onSearchChange(query: string): void {
    this.searchChange.emit(query);
  }
}
