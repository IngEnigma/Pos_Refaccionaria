import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, interval, map, startWith } from 'rxjs';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ShellFacade } from '../../application/facades/shell.facade';
import { AuthFacade } from '@features/auth';
import { StockSyncService } from '@features/inventory-by-branch/application/services/stock-sync.service';
import { formatDate } from '@app/shared/utils/date-format.util';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  private readonly shellFacade = inject(ShellFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly stockSync = inject(StockSyncService);

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

  private readonly navbar = viewChild(NavbarComponent);

  constructor() {
    // POS: el lector de códigos escribe en el buscador del navbar, así que recibe el foco al entrar.
    effect(() => {
      if (this.shellFacade.searchSubmitActive()) this.navbar()?.focusSearch();
    });

    // La sucursal llega asíncrona con el perfil; el polling arranca cuando ya existe.
    effect(() => {
      if (this.authFacade.sucursalId() != null) this.stockSync.start();
      else this.stockSync.stop();
    });
  }

  ngOnInit(): void {
    this.authFacade.refreshProfile().subscribe();
  }

  ngOnDestroy(): void {
    this.stockSync.stop();
  }

  onLogout(): void {
    this.shellFacade.logout();
  }

  onSearchChange(query: string): void {
    this.shellFacade.setSearchQuery(query);
  }

  onSearchSubmit(query: string): void {
    if (this.shellFacade.submitSearch(query)) this.navbar()?.clearSearch();
  }
}
