import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  contentChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { DropdownTriggerDirective } from '@shared/ui/components/dropdown/dropdown-trigger.directive';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [A11yModule],
  template: `<ng-content></ng-content>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
  private static nextId = 0;

  readonly triggerElement = contentChild(DropdownTriggerDirective, { read: ElementRef });

  private readonly overlay = inject(Overlay);
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = signal(false);
  readonly menuId = `app-dropdown-menu-${DropdownComponent.nextId++}`;

  private overlayRef?: OverlayRef;
  private focusTrap?: FocusTrap;
  private menuElement?: HTMLElement;

  @HostListener('keydown.escape')
  onEscape() {
    this.close();
  }

  constructor() {
    this.destroyRef.onDestroy(() => this.disposeOverlay());
  }

  toggle() {
    this.open() ? this.close() : this.show();
  }

  private show() {
    const triggerElement = this.triggerElement();
    if (!triggerElement) return;
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(triggerElement.nativeElement)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
    });

    this.overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.close());

    this.overlayRef
      .keydownEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close();
        }
      });

    this.open.set(true);
  }

  close() {
    this.focusTrap?.destroy();
    this.focusTrap = undefined;
    this.menuElement = undefined;
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
    this.open.set(false);
    this.triggerElement()?.nativeElement?.focus();
  }

  registerMenuElement(element: HTMLElement | null) {
    this.menuElement = element ?? undefined;
    if (this.menuElement) {
      this.focusTrap?.destroy();
      this.focusTrap = this.focusTrapFactory.create(this.menuElement);
      void this.focusTrap.focusInitialElementWhenReady();
    }
  }

  /**
   * @internal
   * @deprecated Use `attach()` instead.
   */
  getOverlayRef() {
    return this.overlayRef;
  }

  /**
   * Attaches a portal to the dropdown's overlay.
   * @internal
   */
  attach(portal: ComponentPortal<any> | TemplatePortal<any>) {
    return this.overlayRef?.attach(portal);
  }

  /**
   * Checks if the overlay currently has a portal attached.
   */
  get isAttached(): boolean {
    return !!this.overlayRef?.hasAttached();
  }

  private disposeOverlay() {
    this.focusTrap?.destroy();
    this.focusTrap = undefined;
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
    this.open.set(false);
  }
}
