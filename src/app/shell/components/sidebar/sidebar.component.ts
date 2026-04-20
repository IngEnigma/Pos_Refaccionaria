import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SidebarNavItem } from '@shell/models/sidebar-nav-item.model';

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
  readonly navItems = input.required<readonly SidebarNavItem[]>();
}
