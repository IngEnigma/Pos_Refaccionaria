import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.button-full]': 'fullWidth()',
    '[style.width]': "fullWidth() ? '100%' : null",
  },
})
export class ButtonComponent {
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'>('primary');
  readonly size = input<'sm' | 'md' | 'lg' | 'compact'>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly loadingText = input('Cargando...');
  readonly fullWidth = input(false);
  readonly onClick = output<void>();

  handleInternalClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.onClick.emit();
  }
}
