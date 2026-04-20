import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { GlobalSearchService } from '@app/core/search/global-search.service';
import { InventoryFacade } from '@app/features/inventory/application/facades/inventory.facade';
import { SalesFacade, ProductTypesFacade, ProductType } from '@app/features/sales';
import { SalesSearchStrategy } from '@app/features/sales/application/strategies/sales-search.strategy';
import { CategorySliderComponent } from '@app/features/sales/presentation/components/category-slider/category-slider.component';
import { InventoryProductGridComponent } from '../../components/inventory-product-grid/inventory-product-grid.component';
import { ProductFormDialogComponent } from '../../components/product-form-dialog/product-form-dialog.component';
import { Product } from '../../../domain/entities/product.entity';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategorySliderComponent,
    InventoryProductGridComponent,
    LucideAngularModule,
    DialogModule
  ],
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPageComponent {
  readonly salesFacade = inject(SalesFacade);
  readonly productTypesFacade = inject(ProductTypesFacade);
  readonly inventoryFacade = inject(InventoryFacade);
  readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  readonly loadingCategories = computed(() => this.productTypesFacade.loading());

  constructor() {
    effect(() => {
      const errorMsg = this.salesFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });

    effect(() => {
      const errorMsg = this.inventoryFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });

    effect(() => {
      const errorMsg = this.productTypesFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
    });
    
    effect(() => {
      const query = this.searchQuery();
      const currentFilter = untracked(() => this.inventoryFacade.productFilter());

      // If query is empty
      if (query.trim() === '') {
        // Only reset to 'all' if we were currently in a 'search' state
        if (currentFilter.type === 'search') {
          this.inventoryFacade.loadProducts(1, false);
        }
        return;
      }

      // Trigger search
      this.inventoryFacade.searchProducts(query);
    }, { allowSignalWrites: true });

  }

  ngOnInit(): void {
    this.salesFacade.loadSales();
    this.salesFacade.loadPaymentMethods();
    this.inventoryFacade.loadProducts();
    this.productTypesFacade.loadProductTypes();
  }

  reloadSales(): void {
    this.salesFacade.loadSales();
    this.inventoryFacade.loadProducts();
  }
  
  private readonly defaultCategory: ProductType = { id: 0, nombre: 'Todos' };
  readonly categories = computed<ProductType[]>(() => [
    this.defaultCategory,
    ...this.productTypesFacade.productTypes(),
  ]);
  readonly selectedCategoryId = signal<number | null>(null);

  private readonly globalSearchService = inject(GlobalSearchService);
  private readonly salesSearchStrategy = inject(SalesSearchStrategy);
  readonly searchQuery = this.globalSearchService.searchQuery;

  onSelectCategory(category: ProductType): void {
    this.selectedCategoryId.set(category.id);
    if (category.nombre === 'Todos') {
      this.inventoryFacade.loadProducts(1, false);
    } else {
      this.inventoryFacade.loadProductsByCategoria(category.nombre, 1, false);
    }
  }

  onLoadMore(): void {
    this.inventoryFacade.loadMore();
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      data: {}
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.inventoryFacade.createProduct(result as any).subscribe({
          next: () => {
            this.toastService.success('Producto creado correctamente');
            this.inventoryFacade.loadProducts();
          },
          error: () => {
            // Error is handled by facade
          }
        });
      }
    });
  }

  onModifyProduct(product: Product): void {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, {
      data: { product }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.inventoryFacade.updateProduct(product.id, result as any).subscribe({
          next: () => {
            this.toastService.success('Producto actualizado correctamente');
            this.inventoryFacade.loadProducts();
          },
          error: () => {
            // Error is handled by facade
          }
        });
      }
    });
  }

  onDeleteProduct(product: Product): void {
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Producto',
        message: `¿Estás seguro de que deseas eliminar el producto "${product.nombre}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger'
      }
    });

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.inventoryFacade.deleteProduct(product.id).subscribe({
          next: () => {
            this.toastService.success('Producto eliminado correctamente');
            // We reload products to refresh the list
            this.inventoryFacade.loadProducts();
          },
          error: () => {
             // Error is already handled/logged by facade, but we can add specific logic here if needed
          }
        });
      }
    });
  }
}
