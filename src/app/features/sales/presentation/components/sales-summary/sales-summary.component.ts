import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-summary.component.html',
  styleUrl: './sales-summary.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesSummaryComponent {
  readonly subtotal = input(0);
  readonly descuento = input(0);
  readonly iva = input(0);
  readonly total = input(0);
}
