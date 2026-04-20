import { Directive, ElementRef, HostBinding, HostListener, inject } from '@angular/core';
import { DropdownComponent } from '@shared/ui/components/dropdown/dropdown.component';

@Directive({
  selector: '[appDropdownTrigger]',
  standalone: true,
})
export class DropdownTriggerDirective {
  private readonly dropdown = inject(DropdownComponent);
  readonly elementRef = inject(ElementRef);

  @HostBinding('attr.aria-haspopup') readonly ariaHasPopup = 'menu';

  @HostBinding('attr.aria-expanded')
  get ariaExpanded(): 'true' | 'false' {
    return this.dropdown.open() ? 'true' : 'false';
  }

  @HostBinding('attr.aria-controls')
  get ariaControls(): string {
    return this.dropdown.menuId;
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdown.toggle();
  }

  @HostListener('keydown.enter')
  @HostListener('keydown.space')
  onKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dropdown.toggle();
  }
}
