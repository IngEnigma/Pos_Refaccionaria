import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `<div class="skeleton" [style]="styles()"></div>`,
  styles: [
    `
      .skeleton {
        background: linear-gradient(
          90deg,
          rgba(238, 238, 238, 0.7) 25%,
          rgba(224, 224, 224, 0.7) 50%,
          rgba(238, 238, 238, 0.7) 75%
        );
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
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

  readonly styles = computed(() => ({
    width: this.width(),
    height: this.height(),
    borderRadius: this.rounded() ? '9999px' : '0.5rem',
  }));
}
