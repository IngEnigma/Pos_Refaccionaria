import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map, startWith } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ShellFacade } from '../../application/facades/shell.facade';
import { formatDate } from '@app/shared/utils/date-format.util';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {

  private readonly shellFacade = inject(ShellFacade);

  readonly username = this.shellFacade.user;
  readonly sidebarItems = this.shellFacade.filteredSidebarItems;
  readonly notifications = this.shellFacade.notifications;
  readonly currentDate = toSignal(
    interval(60_000).pipe(
      startWith(0),
      map(() => formatDate(new Date())),
    ),
    { initialValue: formatDate(new Date()) },
  );

  onLogout(): void {
    this.shellFacade.logout();
  }

  onSearchChange(query: string): void {
    this.shellFacade.setSearchQuery(query);
  }
}
