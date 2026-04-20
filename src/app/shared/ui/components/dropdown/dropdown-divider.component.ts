import { Component } from '@angular/core';

@Component({
  selector: 'app-dropdown-divider',
  standalone: true,
  template: `<div class="dropdown-divider"></div>`,
  styles: [`
    .dropdown-divider {
      height: 1px;
      background: var(--ds-border-subtle);
      margin: var(--pr-space-1) var(--pr-space-2);
    }
  `]
})
export class DropdownDividerComponent {}
