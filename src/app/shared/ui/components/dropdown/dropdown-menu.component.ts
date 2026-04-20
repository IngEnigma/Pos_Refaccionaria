import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  inject,
  ViewContainerRef,
  effect,
  ElementRef,
  viewChild,
} from '@angular/core';
import { TemplatePortal } from '@angular/cdk/portal';
import { DropdownComponent } from '@shared/ui/components/dropdown/dropdown.component';

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  template: `
    <ng-template #menuTemplate>
      <div #menuRoot class="dropdown-menu" role="menu" [id]="menuId" tabindex="-1">
        <ng-content></ng-content>
      </div>
    </ng-template>
  `,
  styles: [`
    .dropdown-menu {
      background: var(--dropdown-bg);
      border: 1px solid var(--dropdown-border);
      border-radius: var(--comp-radius);
      box-shadow: var(--dropdown-shadow);
      padding: var(--pr-space-2);
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      animation: dropdownFadeIn 0.2s ease-out;
    }
    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownMenuComponent {
  readonly menuTemplate = viewChild<TemplateRef<unknown>>('menuTemplate');
  readonly menuRoot = viewChild<ElementRef<HTMLElement>>('menuRoot');
  
  private readonly dropdown = inject(DropdownComponent);
  private readonly viewContainerRef = inject(ViewContainerRef);
  readonly menuId = this.dropdown.menuId;

  constructor() {
    effect(() => {
      if (this.dropdown.open()) {
        const template = this.menuTemplate();
        if (template && !this.dropdown.isAttached) {
          const portal = new TemplatePortal(template, this.viewContainerRef);
          this.dropdown.attach(portal);
          queueMicrotask(() => {
            this.dropdown.registerMenuElement(this.menuRoot()?.nativeElement ?? null);
          });
        }
      } else {
        this.dropdown.registerMenuElement(null);
      }
    }, { allowSignalWrites: true });
  }
}
