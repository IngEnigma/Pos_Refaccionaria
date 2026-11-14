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

  // Search and client-side filters (el backend no los soporta: se resuelven en cliente)
  searchQuery = signal<string>('');
  filterPaymentMethod = signal<number | null>(null);

  // Server-side filters (se envían como ?sucursal_id= e ?id_inventario=)
  filterSucursalId = signal<number | null>(null);
  filterInventarioId = signal<number | null>(null);

  // Pagination (server-side por defecto: GET /api/ventas/?page=&page_size=)
  readonly pageSizeOptions = [10, 20, 50];
  currentPage = signal(1);
  pageSize = signal(10);

  private allCache = signal<SaleHistory[] | null>(null);

  isFiltering = computed(() => this.searchQuery().trim() !== '' || this.filterPaymentMethod() !== null);

  private filteredCache = computed(() => {
    const cache = this.allCache();
    if (!cache) return [];
    const query = this.searchQuery().toLowerCase();
    const method = this.filterPaymentMethod();

    return cache.filter((sale) => {
      const matchesQuery =
        !query ||
        sale.id.toString().includes(query) ||
        sale.usuarioNombre.toLowerCase().includes(query);

      const matchesMethod = method === null || sale.idMetodoPago === method;

      return matchesQuery && matchesMethod;
    });
  });

  private serverTotal = signal(0);

  totalItems = computed(() => (this.isFiltering() ? this.filteredCache().length : this.serverTotal()));
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));

  pagedSales = computed(() => {
    if (!this.isFiltering()) return this.salesHistory();
    const page = Math.min(this.currentPage(), this.totalPages());
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.filteredCache().slice(start, start + size);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = Math.min(this.currentPage(), total);
    const maxVisible = 5;
    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    const end = Math.min(total, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  rangeStart = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (Math.min(this.currentPage(), this.totalPages()) - 1) * this.pageSize() + 1;
  });

  rangeEnd = computed(() =>
    Math.min(this.totalItems(), Math.min(this.currentPage(), this.totalPages()) * this.pageSize()),
  );

  ngOnInit(): void {
    this.loadSalesHistory();
  }

  loadSalesHistory(): void {
    this.currentPage.set(1);
    if (this.isFiltering()) {
      this.loadClientCache();
    } else {
      this.allCache.set(null);
      this.loadServerPage();
    }
  }

  private serverFilters() {
    return {
      sucursalId: this.filterSucursalId(),
      idInventario: this.filterInventarioId(),
    };
  }

  private loadServerPage(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.getSalesHistoryUseCase
      .executePaginated({
        page: this.currentPage(),
        pageSize: this.pageSize(),
        ...this.serverFilters(),
      })
      .subscribe({
        next: (response) => {
          this.salesHistory.set(response.data);
          this.serverTotal.set(response.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading sales history:', err);
          this.error.set('No se pudo cargar el historial de ventas. Por favor, intente de nuevo.');
          this.isLoading.set(false);
        },
      });
  }

  private loadClientCache(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.getSalesHistoryUseCase.execute(this.serverFilters()).subscribe({
      next: (sales) => {
        this.allCache.set(sales);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading sales history:', err);
        this.error.set('No se pudo cargar el historial de ventas. Por favor, intente de nuevo.');
        this.isLoading.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
    if (this.isFiltering() && this.allCache() === null) {
      this.loadClientCache();
    }
  }

  onPaymentMethodChange(value: number | null): void {
    this.filterPaymentMethod.set(value);
    this.currentPage.set(1);
    if (this.isFiltering() && this.allCache() === null) {
      this.loadClientCache();
    }
  }

  onSucursalChange(value: string | number | null): void {
    this.filterSucursalId.set(this.toNullableNumber(value));
    this.currentPage.set(1);
    this.allCache.set(null);
    if (this.isFiltering()) {
      this.loadClientCache();
    } else {
      this.loadServerPage();
    }
  }

  onInventarioChange(value: string | number | null): void {
    this.filterInventarioId.set(this.toNullableNumber(value));
    this.currentPage.set(1);
    this.allCache.set(null);
    if (this.isFiltering()) {
      this.loadClientCache();
    } else {
      this.loadServerPage();
    }
  }

  private toNullableNumber(value: string | number | null): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    if (!this.isFiltering()) {
      this.loadServerPage();
    }
  }

  nextPage(): void {
    this.goToPage(Math.min(this.currentPage(), this.totalPages()) + 1);
  }

  prevPage(): void {
    this.goToPage(Math.min(this.currentPage(), this.totalPages()) - 1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(Number(size));
    this.currentPage.set(1);
    if (!this.isFiltering()) {
      this.loadServerPage();
    }
  }

  handleViewDetail(saleId: number): void {
    const saleInfo =
      this.pagedSales().find((s) => s.id === saleId) ??
      this.salesHistory().find((s) => s.id === saleId) ??
      this.allCache()?.find((s) => s.id === saleId);
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
