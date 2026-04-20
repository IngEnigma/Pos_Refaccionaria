import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import {
  LucideAngularModule,
} from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  standalone: true,
  imports: [LucideAngularModule],
  selector: 'app-toast-container',
  template: `
    <div class="toast-container" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="status" @toastAnimation>
          <div class="toast-content">
            <lucide-icon [name]="icons[toast.type]" [size]="20"></lucide-icon>
            <span class="toast-message" [textContent]="toast.message"></span>
          </div>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar">✕</button>
        </div>
      }
    </div>
  `,
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(20px)' })),
      ]),
    ]),
  ],
  styles: [
    `
      .toast-container {
        position: fixed;
        top: var(--pr-space-4);
        right: var(--pr-space-4);
        display: flex;
        flex-direction: column;
        gap: var(--pr-space-2);
        z-index: 9999;
      }

      .toast {
        display: flex;
        align-items: center;
        font-family: var(--pr-font-title);
        font-weight: var(--pr-weight-semibold);
        font-size: var(--pr-font-size-sm);
        justify-content: space-between;
        gap: var(--pr-space-4);
        min-width: 300px;
        padding: var(--pr-space-3) var(--pr-space-4);
        border-radius: var(--pr-radius-md);
        box-shadow: var(--pr-shadow-md);
      }

      .toast-content {
        display: flex;
        align-items: center;
        gap: var(--pr-space-3);
        flex: 1;
      }

      .toast-message {
        display: inline-block;
        color: inherit;
      }

      .toast-close {
        background: transparent;
        border: none;
        color: var(--ds-text-base);
        cursor: pointer;
        font-size: var(--pr-font-size-sm);
        font-weight: var(--pr-weight-semibold);
        transition: color 0.2s ease;
      }

      .toast--success {
        background-color: color-mix(in srgb, var(--ds-color-success) 10%, var(--ds-bg-surface));
        color: var(--ds-color-success);
        border: 1px solid var(--ds-color-success);
      }
      .toast--error {
        background-color: color-mix(in srgb, var(--ds-color-danger) 10%, var(--ds-bg-surface));
        color: var(--ds-color-danger);
        border: 1px solid var(--ds-color-danger);
      }
      .toast--warning {
        background-color: color-mix(in srgb, var(--ds-color-warning) 10%, var(--ds-bg-surface));
        color: var(--ds-color-warning);
        border: 1px solid var(--ds-color-warning);
      }
      .toast--info {
        background-color: color-mix(in srgb, var(--ds-color-primary) 10%, var(--ds-bg-surface));
        color: var(--ds-color-primary);
        border: 1px solid var(--ds-color-primary);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = {
    success: 'CircleCheck',
    error: 'OctagonX',
    warning: 'TriangleAlert',
    info: 'CircleAlert',
  };
}
