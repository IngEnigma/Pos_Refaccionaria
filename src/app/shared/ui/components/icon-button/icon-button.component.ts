import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconButtonComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly variant = input<'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'>('ghost');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly isActive = input(false);
}
