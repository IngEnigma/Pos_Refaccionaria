import { ChangeDetectionStrategy, Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-button',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      class="button-base"
      [class.button-primary]="variant() === 'primary'"
      [class.button-secondary]="variant() === 'secondary'"
      [class.button-full]="fullWidth()"
      (click)="onClick.emit($event)"
    >
      <ng-container *ngIf="!loading(); else loadingTemplate">
        <ng-content></ng-content>
      </ng-container>
      <ng-template #loadingTemplate>
        <span class="spinner"></span> {{ loadingText() }}
      </ng-template>
    </button>
  `,
    styles: [`
    .button-base {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      transition: all 0.2s ease-in-out;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }
    .button-base:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none !important;
    }
    .button-primary {
      background-color: #233387;
      color: #fff;
    }
    .button-primary:hover:not(:disabled) {
      background-color: #1a266b;
      transform: translateY(-1px);
      box-shadow: 0 4px 6px rgba(35, 51, 135, 0.2);
    }
    .button-primary:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: none;
    }
    .button-secondary {
      background-color: #f3f4f6;
      color: #374151;
      border: 1px solid #e5e7eb;
    }
    .button-secondary:hover:not(:disabled) {
      background-color: #e5e7eb;
      transform: translateY(-1px);
    }
    .button-full {
      width: 100%;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
    type = input<'button' | 'submit' | 'reset'>('button');
    variant = input<'primary' | 'secondary'>('primary');
    disabled = input(false);
    loading = input(false);
    loadingText = input('Cargando...');
    fullWidth = input(false);

    onClick = output<Event>();
}
