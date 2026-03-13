import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-quantity-control',
  standalone: true,
  templateUrl: './quantity-control.component.html',
  styleUrl: './quantity-control.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityControlComponent {
  readonly value = input(1);
  readonly increase = output<void>();
  readonly decrease = output<void>();
}
