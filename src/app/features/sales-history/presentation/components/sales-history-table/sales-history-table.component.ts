import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { SaleHistory } from '../../../domain/entities/sale-history.entity';
import { SkeletonComponent } from '@shared/ui/components/skeleton/skeleton.component';

@Component({
  selector: 'app-sales-history-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, SkeletonComponent],
  templateUrl: './sales-history-table.component.html',
  styleUrl: './sales-history-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesHistoryTableComponent {
  sales = input.required<SaleHistory[]>();
  loading = input<boolean>(false);
  
  viewDetail = output<number>();

  onViewDetail(saleId: number): void {
    this.viewDetail.emit(saleId);
  }

  trackBySaleId(index: number, sale: SaleHistory): number {
    return sale.id;
  }
}
