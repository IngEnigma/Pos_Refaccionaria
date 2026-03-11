import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  template: `
    <div class="toast-container" aria-live="polite" aria-label="Notificaciones">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.type }}" role="status">
          <span>{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar">✕</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        z-index: 9999;
      }

      .toast {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-width: 300px;
        padding: 1rem;
        border-radius: var(--radius-md, 0.5rem);
        color: white;
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
        animation: slideIn 0.3s ease-out;
      }

      .toast--success {
        background-color: var(--color-success-500, #22c55e);
      }
      .toast--error {
        background-color: var(--color-danger-500, #ef4444);
      }
      .toast--warning {
        background-color: var(--color-warning-500, #f59e0b);
      }
      .toast--info {
        background-color: var(--color-primary-500, #3b82f6);
      }

      .toast-close {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.8;
      }

      .toast-close:hover {
        opacity: 1;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
