import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map, startWith } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ShellFacade } from '../../application/facades/shell.facade';
import { AuthFacade } from '@features/auth';
import { formatDate } from '@app/shared/utils/date-format.util';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {

  private readonly shellFacade = inject(ShellFacade);
  private readonly authFacade = inject(AuthFacade);

  readonly username = this.shellFacade.user;
  readonly sucursalId = this.authFacade.sucursalId;
  readonly sidebarItems = this.shellFacade.filteredSidebarItems;
  readonly currentDate = toSignal(
    interval(60_000).pipe(
      startWith(0),
      map(() => formatDate(new Date())),
    ),
    { initialValue: formatDate(new Date()) },
  );

  ngOnInit(): void {
    this.authFacade.refreshProfile().subscribe();
  }

  onLogout(): void {
    this.shellFacade.logout();
  }

  onSearchChange(query: string): void {
    this.shellFacade.setSearchQuery(query);
  }
}
