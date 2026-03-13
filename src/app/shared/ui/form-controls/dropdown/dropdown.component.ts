import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation,
  signal
} from '@angular/core';

import {
  Overlay,
  OverlayModule,
  OverlayRef
} from '@angular/cdk/overlay';

import { TemplatePortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [OverlayModule],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.css',
  exportAs: 'appDropdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DropdownComponent {

  @ViewChild('trigger', { read: ElementRef })
  trigger!: ElementRef;

  @ViewChild('menu')
  menu!: TemplateRef<any>;

  private overlayRef!: OverlayRef;

  readonly open = signal(false);

  constructor(
    private overlay: Overlay,
    private viewContainerRef: ViewContainerRef
  ) {}

  toggle() {

    if (this.open()) {
      this.close();
      return;
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.trigger.nativeElement)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8,
          offsetX: 0,
        },
      ]);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    this.overlayRef.backdropClick().subscribe(() => this.close());

    const portal = new TemplatePortal(this.menu, this.viewContainerRef);

    this.overlayRef.attach(portal);

    this.open.set(true);
  }

  close() {
    this.overlayRef?.dispose();
    this.open.set(false);
  }
}