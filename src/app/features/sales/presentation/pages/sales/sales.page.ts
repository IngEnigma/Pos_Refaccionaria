import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { ProductTypesFacade } from '@features/sales/application/facades/product-types.facade';
import { CategorySliderComponent } from '@features/sales/presentation/components/category-slider/category-slider.component';
import { CartPanelComponent } from '@features/sales/presentation/components/cart-panel/cart-panel.component';
import { ProductGridComponent } from '@features/sales/presentation/components/product-grid/product-grid.component';
import {
  SalesCartItem,
  SalesPaymentMethod,
  SalesProduct,
} from '@features/sales/presentation/models/sales-ui.models';
import { SalesCartService } from '@features/sales/presentation/state/sales-cart.service';
import { InventoryFacade } from '@features/inventory';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { GlobalSearchService } from '@core/search/global-search.service';
import { SalesSearchStrategy } from '@features/sales/application/strategies/sales-search.strategy';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CategorySliderComponent, ProductGridComponent, CartPanelComponent],
  templateUrl: './sales.page.html',
  styleUrl: './sales.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SalesCartService],
})
export class SalesPageComponent implements OnInit {
  readonly salesFacade = inject(SalesFacade);
  readonly productTypesFacade = inject(ProductTypesFacade);
  readonly inventoryFacade = inject(InventoryFacade);
  readonly toastService = inject(ToastService);
  readonly cartService = inject(SalesCartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingProducts = computed(() => this.inventoryFacade.loading());
  readonly loadingCategories = computed(() => this.productTypesFacade.loading());
  readonly isCreatingSale = this.salesFacade.isCreatingSale;
  readonly submitDisabled = computed(() =>
    this.isCreatingSale() || this.cartItems().length === 0 || !this.selectedPayment()
  );

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

  readonly productos = computed<SalesProduct[]>(() => {
    const products = this.inventoryFacade.products();

    return products.map((product) => ({
      id: product.id,
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      precio: product.precioVenta,
      stock: product.existencia,
      imagen: 'assets/images/Refaccionaria.webp',
    }));
  });

  readonly cartItems = this.cartService.cart;
  readonly descuento = this.cartService.descuento;
  readonly subtotal = this.cartService.subtotal;
  readonly iva = this.cartService.iva;
  readonly total = this.cartService.total;
  readonly selectedPayment = this.cartService.selectedPayment;
  readonly paymentMethods = this.salesFacade.paymentMethods;

  onAddToCart(product: SalesProduct): void {
    this.cartService.addToCart(product);
  }

  onSelectCategory(category: ProductType): void {
    this.selectedCategoryId.set(category.id);
    if (category.nombre === 'Todos') {
      this.inventoryFacade.loadProducts(1, false);
    } else {
      this.inventoryFacade.loadProductsByCategoria(category.nombre, 1, false);
    }
  }

  onIncreaseQty(item: SalesCartItem): void {
    this.cartService.increaseQty(item);
  }

  onDecreaseQty(item: SalesCartItem): void {
    this.cartService.decreaseQty(item);
  }

  onRemoveItem(item: SalesCartItem): void {
    this.cartService.removeItem(item);
  }

  onSelectPayment(method: SalesPaymentMethod): void {
    this.cartService.selectPayment(method);
  }

  processTransaction(): void {
    this.cartService
      .confirmSale()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Venta registrada correctamente.');
          this.inventoryFacade.loadProducts();
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'No fue posible registrar la venta.';
          this.toastService.error(message);
        },
      });
  }

  onLoadMore(): void {
    this.inventoryFacade.loadMore();
  }
}
