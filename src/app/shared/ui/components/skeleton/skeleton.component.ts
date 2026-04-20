import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="skeleton" [style]="styles()" role="presentation" aria-hidden="true"></div>`,
  styles: [
    `
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--skeleton-base) 30%,
          var(--skeleton-active) 45%,
          var(--skeleton-base) 60%
        );
        background-size: 200% 100%;
        animation: shimmer 2s linear infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          background: var(--skeleton-base);
        }
      }
      @keyframes shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: -100% 0;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly width = input('100%');
  readonly height = input('1rem');
  readonly rounded = input(false);
  readonly borderRadius = input<string>();

  readonly styles = computed(() => ({
    width: this.width(),
    height: this.height(),
    borderRadius: this.borderRadius() || (this.rounded() ? 'var(--pr-radius-full)' : 'var(--pr-radius-md)'),
  }));
}
