import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, effect } from '@angular/core';

import { ButtonComponent } from '@app/shared/ui/form-controls/button/button.component';
import { SkeletonComponent } from '@app/shared/ui/components/skeleton/skeleton.component';
import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [ButtonComponent, SkeletonComponent, CurrencyPipe, DatePipe],
  templateUrl: './sales.page.html',
  styleUrl: './sales.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesPageComponent implements OnInit {
  readonly facade = inject(SalesFacade);
  readonly toastService = inject(ToastService);
  readonly skeletonRows = [1, 2, 3, 4];

  constructor() {
    effect(() => {
      const errorMsg = this.facade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
  }

  ngOnInit(): void {
    this.facade.loadSales();
  }

  reloadSales(): void {
    this.facade.loadSales();
  }
}
