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
import { FormsModule } from '@angular/forms';

import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
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
import { InventoryByBranchFacade } from '@features/inventory-by-branch';
import { Product, ProductStock } from '@features/inventory/domain/entities/product.entity';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { GlobalSearchService } from '@core/search/global-search.service';
import { SalesSearchStrategy } from '@features/sales/application/strategies/sales-search.strategy';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [FormsModule, CategorySliderComponent, ProductGridComponent, CartPanelComponent],
  templateUrl: './sales.page.html',
  styleUrl: './sales.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SalesCartService],
})
export class SalesPageComponent implements OnInit {
  readonly authFacade = inject(AuthFacade);
  readonly salesFacade = inject(SalesFacade);
  readonly productTypesFacade = inject(ProductTypesFacade);
  readonly inventoryFacade = inject(InventoryFacade);
  readonly inventoryByBranchFacade = inject(InventoryByBranchFacade);
  readonly toastService = inject(ToastService);
  readonly cartService = inject(SalesCartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingProducts = computed(() => this.inventoryFacade.loading());
  readonly loadingCategories = computed(() => this.productTypesFacade.loading());
  readonly isCreatingSale = this.salesFacade.isCreatingSale;
  readonly submitDisabled = computed(() =>
    this.isCreatingSale() || this.cartItems().length === 0 || !this.selectedPayment()
  );

  readonly barcodeInput = signal('');

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
      const inventories = this.inventoryByBranchFacade.inventory();
      if (inventories.length > 0) {
        const firstInventory = inventories[0];
        this.cartService.setVentaInventarioId(firstInventory.idInventario);
      }
    });

    effect(() => {
      const query = this.searchQuery();
      const currentFilter = untracked(() => this.inventoryFacade.productFilter());
      const sucursalId = untracked(() => this.authFacade.sucursalId());
      const searchParams = sucursalId != null ? { sucursalId } : undefined;

      if (query.trim() === '') {
        if (currentFilter.type === 'search') {
          this.inventoryFacade.loadProducts(1, false, searchParams);
        }
        return;
      }

      this.inventoryFacade.searchProducts(query, 1, false, searchParams);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.salesFacade.loadSales();
    this.salesFacade.loadPaymentMethods();
    this.productTypesFacade.loadProductTypes();

    const sucursalId = this.authFacade.sucursalId();
    if (sucursalId != null) {
      this.cartService.setVentaInventarioId(null);
      this.inventoryByBranchFacade.loadMyBranchInventory();

      const searchParams = { sucursalId };
      this.inventoryFacade.loadProducts(1, false, searchParams);
    } else {
      this.inventoryFacade.loadProducts();
    }
  }

  reloadSales(): void {
    this.salesFacade.loadSales();

    const sucursalId = this.authFacade.sucursalId();
    if (sucursalId != null) {
      this.inventoryFacade.loadProducts(1, false, { sucursalId });
    } else {
      this.inventoryFacade.loadProducts();
    }
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

    return products.map((product) => {
      const hasStock = this.isProductStock(product);
      const stock = hasStock ? (product as ProductStock).cantidad : 0;
      const precioSucursal = hasStock ? (product as ProductStock).precioSucursal : null;
      const precioBase = hasStock ? (product as ProductStock).precioBase : product.precioVenta;

      return {
        id: product.id,
        nombre: product.nombre,
        descripcion: product.descripcion || '',
        precio: precioSucursal ?? precioBase,
        stock,
        codigoBarras: product.codigoBarras,
        imagen: 'assets/images/Refaccionaria.webp',
        hasSucursalPrice: precioSucursal !== null,
      };
    });
  });

  readonly cartItems = this.cartService.cart;
  readonly descuento = this.cartService.descuento;
  readonly subtotal = this.cartService.subtotal;
  readonly iva = this.cartService.iva;
  readonly total = this.cartService.total;
  readonly selectedPayment = this.cartService.selectedPayment;
  readonly paymentMethods = this.salesFacade.paymentMethods;

  onBarcodeKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    const codigo = this.barcodeInput().trim();
    if (!codigo) return;

    this.inventoryFacade.getProductByBarcode(codigo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          if (!product) {
            this.toastService.error('Producto no registrado');
            return;
          }

          const existingProducts = this.productos();
          const matched = existingProducts.find(p => p.id === product.id);

          if (matched) {
            if (matched.stock <= 0) {
              this.toastService.error('Producto sin existencias en esta sucursal');
              return;
            }
            this.onAddToCart(matched);
            this.toastService.success(`${product.nombre} agregado al carrito`);
          } else {
            this.toastService.warning('Producto encontrado pero sin stock en esta sucursal');
          }
        },
        error: () => {
          this.toastService.error('Error al buscar producto por código de barras');
        },
      });

    this.barcodeInput.set('');
  }

  onAddToCart(product: SalesProduct): void {
    this.cartService.addToCart(product);
  }

  onSelectCategory(category: ProductType): void {
    this.selectedCategoryId.set(category.id);
    const sucursalId = this.authFacade.sucursalId();
    const searchParams = sucursalId != null ? { sucursalId } : undefined;

    if (category.nombre === 'Todos') {
      this.inventoryFacade.loadProducts(1, false, searchParams);
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
          const sucursalId = this.authFacade.sucursalId();
          if (sucursalId != null) {
            this.inventoryFacade.loadProducts(1, false, { sucursalId });
          } else {
            this.inventoryFacade.loadProducts();
          }
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

  private isProductStock(product: Product): product is ProductStock {
    return 'cantidad' in product && 'precioSucursal' in product;
  }
}
