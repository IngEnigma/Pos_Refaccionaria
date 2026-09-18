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
import { InventoryByBranchFacade } from '@features/inventory-by-branch';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { GlobalSearchService } from '@core/search/global-search.service';

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
  readonly inventoryByBranchFacade = inject(InventoryByBranchFacade);
  readonly toastService = inject(ToastService);
  readonly cartService = inject(SalesCartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingProducts = computed(() => this.inventoryByBranchFacade.loading());
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
      const errorMsg = this.inventoryByBranchFacade.errorMessage();
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

    // Carga reactiva: si sucursalId llega después (refreshProfile async en MainLayout)
    effect(
      () => {
        const sucursalId = this.authFacade.sucursalId();
        if (sucursalId != null) {
          this.inventoryByBranchFacade.loadMyBranchInventory();
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.salesFacade.loadSales();
    this.salesFacade.loadPaymentMethods();
    this.productTypesFacade.loadProductTypes();

    // Carga inicial si ya hay sucursal (ej. refresh)
    const sucursalId = this.authFacade.sucursalId();
    if (sucursalId != null) {
      this.inventoryByBranchFacade.loadMyBranchInventory();
    }
  }

  reloadSales(): void {
    this.salesFacade.loadSales();
    this.inventoryByBranchFacade.loadMyBranchInventory();
  }

  private readonly defaultCategory: ProductType = { id: 0, nombre: 'Todos' };
  readonly categories = computed<ProductType[]>(() => [
    this.defaultCategory,
    ...this.productTypesFacade.productTypes(),
  ]);
  readonly selectedCategoryId = signal<number | null>(null);

  readonly searchQuery = inject(GlobalSearchService).searchQuery;

  // Productos vienen exclusivamente de mi-sucursal (única fuente de stock/precio)
  readonly productos = computed<SalesProduct[]>(() => {
    const items = this.inventoryByBranchFacade.allItems();
    // Filtro local por búsqueda y categoría (sin consulta adicional a /productos)
    const query = this.searchQuery().trim().toLowerCase();
    const selectedCategoryId = this.selectedCategoryId();
    // Nota: InventoryItem no expone id_tipo; filtro categoría deshabilitado si no hay mapeo
    // Se mantiene el slider pero el filtrado se hace por nombre/clave si hay query
    let filtered = items;
    if (query) {
      filtered = filtered.filter(
        (it) =>
          it.nombre.toLowerCase().includes(query) ||
          it.clave.toLowerCase().includes(query) ||
          it.codigoBarras.toLowerCase().includes(query) ||
          it.marca.toLowerCase().includes(query)
      );
    }
    // TODO: si se requiere filtro por tipo, InventoryItem debería incluir id_tipo/nombre_tipo

    return filtered.map((item) => ({
      id: item.idProducto,
      nombre: item.nombre,
      descripcion: item.clave,
      precio: item.precioSucursal ?? item.precioBase,
      stock: item.cantidad,
      codigoBarras: item.codigoBarras,
      imagen: 'assets/images/Refaccionaria.webp',
      hasSucursalPrice: item.precioSucursal !== null,
    }));
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

    // Búsqueda local en mi-sucursal (sin llamada a /productos/codigo-barras)
    const existingProducts = this.productos();
    const matched = existingProducts.find(
      (p) => p.codigoBarras.trim().toLowerCase() === codigo.toLowerCase()
    );

    if (!matched) {
      this.toastService.warning('Producto no encontrado en tu sucursal o sin stock');
    } else {
      if (matched.stock <= 0) {
        this.toastService.error('Producto sin existencias en esta sucursal');
      } else {
        this.onAddToCart(matched);
        this.toastService.success(`${matched.nombre} agregado al carrito`);
      }
    }

    this.barcodeInput.set('');
  }

  onAddToCart(product: SalesProduct): void {
    this.cartService.addToCart(product);
  }

  onSelectCategory(category: ProductType): void {
    this.selectedCategoryId.set(category.id);
    // Filtrado local sobre mi-sucursal; no se consulta /productos
    // Si necesitas filtro por categoría real, agregar id_tipo a InventoryItem
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
    // Validación fresca contra stock actual de mi-sucursal (evita POST si el stock cambió desde que se agregó al carrito)
    const freshStockById = new Map<number, number>(
      this.inventoryByBranchFacade.allItems().map((it) => [it.idProducto, it.cantidad]),
    );
    for (const item of this.cartService.cart()) {
      const freshStock = freshStockById.get(item.productId);
      if (freshStock === undefined) {
        this.toastService.error(`"${item.nombre}" ya no está disponible en tu sucursal. Recarga el catálogo.`);
        this.inventoryByBranchFacade.loadMyBranchInventory();
        return;
      }
      if (item.qty > freshStock) {
        this.toastService.error(
          `Stock insuficiente para "${item.nombre}": solicitas ${item.qty}, disponible ${freshStock}.`,
        );
        return;
      }
    }

    this.cartService
      .confirmSale()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success('Venta registrada correctamente.');
          this.inventoryByBranchFacade.loadMyBranchInventory();
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'No fue posible registrar la venta.';
          this.toastService.error(message);
          // Si el backend reportó stock insuficiente, refrescar para mostrar stock real
          if (/stock|disponible|inventario/i.test(message)) {
            this.inventoryByBranchFacade.loadMyBranchInventory();
          }
        },
      });
  }

  onLoadMore(): void {
    // Paginación local no necesaria; mi-sucursal trae todo el inventario
  }
}
