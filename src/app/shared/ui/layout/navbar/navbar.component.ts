import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private static readonly DATE_FORMATTER = new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  readonly username = input('Miguel Lara');
  readonly currentDate = input(NavbarComponent.DATE_FORMATTER.format(new Date()));
  readonly searchPlaceholder = input('Buscar por código, producto o cliente');
  readonly profileIconPath = input('assets/icons/profile.svg');
  readonly notificationsIconPath = input('assets/icons/notifications.svg');

  readonly searchChange = output<string>();
  readonly profileClick = output<void>();
  readonly notificationsClick = output<void>();

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchChange.emit(target.value);
  }

  onProfileClick(): void {
    this.profileClick.emit();
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }
}
