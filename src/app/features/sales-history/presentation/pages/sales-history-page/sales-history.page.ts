import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GetSalesHistoryUseCase } from '../../../application/usecase/get-sales-history.usecase';
import { GetSaleDetailUseCase } from '../../../../sales/application/usecase/get-sale-detail.usecase';
import { SaleHistory } from '../../../domain/entities/sale-history.entity';
import { DetailedSale } from '../../../../sales/domain/entities/detailed-sale.entity';
import { SalesHistoryTableComponent } from '../../components/sales-history-table/sales-history-table.component';
import { SaleDetailModalComponent } from '../../components/sale-detail-modal/sale-detail-modal.component';

@Component({
  selector: 'app-sales-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SalesHistoryTableComponent, SaleDetailModalComponent],
  templateUrl: './sales-history.page.html',
  styleUrl: './sales-history.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesHistoryPageComponent implements OnInit {
  private readonly getSalesHistoryUseCase = inject(GetSalesHistoryUseCase);
  private readonly getSaleDetailUseCase = inject(GetSaleDetailUseCase);

  salesHistory = signal<SaleHistory[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  selectedSale = signal<DetailedSale | null>(null);
  selectedSellerName = signal<string | null>(null);
  isDetailLoading = signal<boolean>(false);

  // Search and Filters
  searchQuery = signal<string>('');
  filterPaymentMethod = signal<number | null>(null);

  // Computed: Filtered Sales
  filteredSales = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const method = this.filterPaymentMethod();
    
    return this.salesHistory().filter(sale => {
      const matchesQuery = !query || 
        sale.id.toString().includes(query) || 
        sale.usuarioNombre.toLowerCase().includes(query);
      
      const matchesMethod = method === null || sale.idMetodoPago === method;
      
      return matchesQuery && matchesMethod;
    });
  });


  ngOnInit(): void {
    this.loadSalesHistory();
  }

  loadSalesHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.getSalesHistoryUseCase.execute().subscribe({
      next: (sales) => {
        this.salesHistory.set(sales);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading sales history:', err);
        this.error.set('No se pudo cargar el historial de ventas. Por favor, intente de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  handleViewDetail(saleId: number): void {
    // Extract seller name from local list
    const saleInfo = this.salesHistory().find(s => s.id === saleId);
    this.selectedSellerName.set(saleInfo?.usuarioNombre || 'Desconocido');

    this.isDetailLoading.set(true);
    this.getSaleDetailUseCase.execute(saleId).subscribe({
      next: (sale) => {
        this.selectedSale.set(sale);
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading sale detail:', err);
        this.isDetailLoading.set(false);
      },
    });
  }

  closeDetail(): void {
    this.selectedSale.set(null);
  }
}
