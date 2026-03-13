import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DEFAULT_SIDEBAR_NAV_ITEMS } from './sidebar-menu.config';
import { SidebarNavItem } from './sidebar-nav-item.model';
import { LucideAngularModule } from 'lucide-angular';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
    LucideAngularModule,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly logoPath = input('assets/images/Logo_Horizontal.webp');
  readonly navItems = input<readonly SidebarNavItem[]>(
    DEFAULT_SIDEBAR_NAV_ITEMS,
  );
}
