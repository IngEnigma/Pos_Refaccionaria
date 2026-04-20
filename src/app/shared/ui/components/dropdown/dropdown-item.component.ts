import { Component, input, output, inject } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { DropdownComponent } from '@shared/ui/components/dropdown/dropdown.component';

@Component({
  selector: 'app-dropdown-item',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button 
      class="dropdown-item" 
      [class.dropdown-item--danger]="variant() === 'danger'"
      [class.dropdown-item--disabled]="disabled()"
      [disabled]="disabled()"
      (click)="handleAction()"
      role="menuitem"
    >
      @if (icon()) {
        <lucide-icon [name]="icon()!" [size]="18" class="item-icon"></lucide-icon>
      }
      <span><ng-content></ng-content></span>
    </button>
  `,
  styles: [`
    .dropdown-item {
      width: 100%;
      display: flex;
      align-items: center;
      min-height: 2.5rem;
      gap: var(--pr-space-3);
      padding: var(--pr-space-2) var(--pr-space-3);
      border: none;
      background: transparent;
      border-radius: var(--pr-radius-md);
      cursor: pointer;
      color: var(--ds-text-base);
      font-family: var(--pr-font-text);
      font-size: var(--pr-font-size-sm);
      line-height: 1.25;
      transition: background 0.2s;
      text-align: left;
    }
    .dropdown-item:hover {
      background: var(--ds-state-hover);
      color: var(--ds-text-strong);
    }
    .item-icon {
      opacity: 0.7;
    }
    .dropdown-item--danger {
      color: var(--ds-color-danger);
    }
    .dropdown-item--danger:hover {
      background: color-mix(in srgb, var(--ds-color-danger) 5%, var(--ds-bg-surface));
      color: var(--ds-color-danger);
    }
    .dropdown-item--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  `]
})
export class DropdownItemComponent {
  readonly icon = input<string | LucideIconData>();
  readonly variant = input<'default' | 'danger'>('default');
  readonly disabled = input<boolean>(false);
  readonly action = output<void>();

  private readonly dropdown = inject(DropdownComponent);

  handleAction() {
    if (this.disabled()) return;
    this.action.emit();
    this.dropdown.close();
  }
}
