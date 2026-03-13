import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SearchInputComponent } from "../../form-controls/search-input/search-input.component";
import { IconButtonComponent } from "../../form-controls/icon-button/icon-button.component";
import { DropdownComponent } from '../../form-controls/dropdown/dropdown.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [SearchInputComponent, IconButtonComponent, DropdownComponent, LucideAngularModule],
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
  readonly profileIconPath = input('user');
  readonly notificationsIconPath = input('bell');

  readonly profileClick = output<void>();
  readonly notificationsClick = output<void>();

  onProfileClick(): void {
    this.profileClick.emit();
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }

  onLogout(): void {
  
  }  
} 
