import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ButtonComponent } from '@app/shared/ui/form-controls/button/button.component';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [ButtonComponent, CurrencyPipe, DatePipe],
  templateUrl: './sales.page.html',
  styleUrl: './sales.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesPageComponent implements OnInit {
  readonly facade = inject(SalesFacade);
  readonly skeletonRows = [1, 2, 3, 4];

  ngOnInit(): void {
    this.facade.loadSales();
  }

  reloadSales(): void {
    this.facade.loadSales();
  }
}
