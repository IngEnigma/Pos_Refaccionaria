import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { ProductTypesFacade } from '@features/sales/application/facades/product-types.facade';
import { CategorySliderComponent } from '@features/sales/presentation/components/category-slider/category-slider.component';
import { CartPanelComponent } from '@features/sales/presentation/components/cart-panel/cart-panel.component';
import { InventoryProductGridComponent } from '@features/inventory/presentation/components/inventory-product-grid/inventory-product-grid.component';
import { InventoryFacade } from '@features/inventory/application/facades/inventory.facade';
import { InventoryItem } from '@features/inventory-by-branch/domain/entities/inventory-item.entity';
import { TicketModalComponent } from '@features/sales/presentation/components/ticket-modal/ticket-modal.component';
import { ClientSelectorModalComponent } from '@features/sales/presentation/components/client-selector-modal/client-selector-modal.component';
import {
  SalesCartItem,
  SalesPaymentMethod,
  SalesProduct,
} from '@features/sales/presentation/models/sales-ui.models';
import { SalesCartService } from '@features/sales/presentation/state/sales-cart.service';
import { InventoryByBranchFacade } from '@features/inventory-by-branch';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import { GlobalSearchService } from '@core/search/global-search.service';
import { DESKTOP_PORT } from '@core/ports/desktop.port';
import { toTicketPrintPayload } from '@features/sales/application/mappers/ticket-print-payload.mapper';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { Client } from '@features/clients/domain/entities/client.entity';

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CategorySliderComponent, InventoryProductGridComponent, CartPanelComponent, TicketModalComponent, ClientSelectorModalComponent],
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
  readonly inventoryFacade = inject(InventoryFacade);
  readonly toastService = inject(ToastService);
  readonly cartService = inject(SalesCartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly desktop = inject(DESKTOP_PORT);

  readonly loadingProducts = computed(() => this.inventoryByBranchFacade.loading());
  readonly loadingCategories = computed(() => this.productTypesFacade.loading());
  readonly isCreatingSale = this.salesFacade.isCreatingSale;
  readonly submitDisabled = computed(() =>
    this.isCreatingSale() || this.cartItems().length === 0 || !this.selectedPayment()
  );

  readonly lastTicket = signal<SaleTicket | null>(null);
  readonly clientSelectorOpen = signal(false);

  /** Etiqueta del cliente de la venta actual: nombre completo o "Público general". */
  readonly clienteLabel = computed(() => {
    const client = this.cartService.selectedClient();
    if (!client) return 'Público general';
    const apellidos = [client.apellidoPaterno, client.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim();
    return `${client.nombre} ${apellidos}`.trim();
  });

  constructor() {
    // El lector de códigos escribe en el buscador del navbar; Enter ahí agrega al carrito.
    const search = inject(GlobalSearchService);
    search.submitHandler.set((code) => this.onScan(code));
    this.destroyRef.onDestroy(() => search.submitHandler.set(null));

    effect(() => {
      const errorMsg = this.inventoryFacade.errorMessage();
      if (errorMsg) this.toastService.error(errorMsg);
    }, { allowSignalWrites: true }); // H-43: el toast escribe señales (NG0600)

    effect(() => {
      const errorMsg = this.salesFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
      // H-43: el toast escribe una señal; sin esto Angular lanza NG0600 y el error no se mostraba.
    }, { allowSignalWrites: true });

    effect(() => {
      const errorMsg = this.inventoryByBranchFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
      // H-43: el toast escribe una señal; sin esto Angular lanza NG0600 y el error no se mostraba.
    }, { allowSignalWrites: true });

    effect(() => {
      const errorMsg = this.productTypesFacade.errorMessage();
      if (errorMsg) {
        this.toastService.error(errorMsg);
      }
      // H-43: el toast escribe una señal; sin esto Angular lanza NG0600 y el error no se mostraba.
    }, { allowSignalWrites: true });

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
  readonly catalogItems = computed<readonly InventoryItem[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const catId = this.selectedCategoryId();
    let filtered = this.inventoryByBranchFacade.allItems();
    if (query) {
      filtered = filtered.filter(
        (it) =>
          it.nombre.toLowerCase().includes(query) ||
          it.clave.toLowerCase().includes(query) ||
          it.codigoBarras.toLowerCase().includes(query) ||
          it.marca.toLowerCase().includes(query)
      );
    }
    // Igual que inventario (H-F6-5): mi-sucursal no trae id_tipo; se cruza con GET /productos/?tipo_id=.
    if (catId) {
      const ids = new Set(this.inventoryFacade.products().map((p) => p.id));
      filtered = filtered.filter((it) => ids.has(it.idProducto));
    }
    return filtered;
  });

  readonly productos = computed<SalesProduct[]>(() => this.catalogItems().map(toSalesProduct));

  readonly cartItems = this.cartService.cart;
  readonly subtotal = this.cartService.subtotal;
  readonly iva = this.cartService.iva;
  readonly total = this.cartService.total;
  readonly selectedPayment = this.cartService.selectedPayment;
  readonly paymentMethods = this.salesFacade.paymentMethods;

  /** Enter en el buscador del navbar. true = código reconocido, el buscador se limpia. */
  onScan(raw: string): boolean {
    const codigo = raw.trim().toLowerCase();
    if (!codigo) return false;

    // Búsqueda local en mi-sucursal (sin llamada a /productos/codigo-barras)
    const matched = this.inventoryByBranchFacade
      .allItems()
      .find((it) => it.codigoBarras.trim().toLowerCase() === codigo);

    if (!matched) {
      this.toastService.warning('Producto no encontrado en tu sucursal o sin stock');
      return false;
    }
    if (matched.cantidad <= 0) {
      this.toastService.error('Producto sin existencias en esta sucursal');
    } else {
      this.onAddItem(matched);
      this.toastService.success(`${matched.nombre} agregado al carrito`);
    }
    return true;
  }

  onAddItem(item: InventoryItem): void {
    this.onAddToCart(toSalesProduct(item));
  }

  onAddToCart(product: SalesProduct): void {
    this.cartService.addToCart(product);
  }

  onSelectCategory(category: ProductType): void {
    this.selectedCategoryId.set(category.id);
    if (category.id) this.inventoryFacade.loadProducts(1, false, { tipoId: category.id });
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

  onTicketModalClose(): void {
    this.lastTicket.set(null);
  }

  onOpenClientSelector(): void {
    this.clientSelectorOpen.set(true);
  }

  onCloseClientSelector(): void {
    this.clientSelectorOpen.set(false);
  }

  onSelectClient(client: Client | null): void {
    this.cartService.selectClient(client);
    this.clientSelectorOpen.set(false);
  }

  processTransaction(): void {
    // Guardia in-flight: si ya hay una transacción en curso se ignora (evita doble POST).
    if (this.isCreatingSale()) return;

    // Validación fresca contra stock actual de mi-sucursal (evita POST si el stock cambió desde que se agregó al carrito)
    const issue = this.cartService.findStockIssue(
      new Map(this.inventoryByBranchFacade.allItems().map((it) => [it.idProducto, it.cantidad])),
    );
    if (issue) {
      this.toastService.error(issue.message);
      if (issue.kind === 'missing') this.inventoryByBranchFacade.loadMyBranchInventory();
      return;
    }

    this.cartService
      .confirmSale()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.toastService.success('Venta registrada correctamente.');
          this.inventoryByBranchFacade.loadMyBranchInventory();
          if (!result.ticket) {
            this.toastService.warning('Venta registrada, pero no se pudo obtener el ticket. Consúltalo en el historial de ventas.');
            return;
          }
          this.lastTicket.set(result.ticket);

          this.desktop
            ?.generateTicket(toTicketPrintPayload(result.ticket))
            .then((response) => {
              if (!response.success) {
                this.toastService.error(response.message ?? 'No fue posible generar el ticket.');
              }
            })
            .catch(() => this.toastService.error('No fue posible generar el ticket.'));
        },
        error: (error: unknown) => {
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'No fue posible registrar la venta.';
          this.toastService.error(message);
          // Si el backend reportó stock insuficiente, refrescar para mostrar stock real.
          // Un 404 (p. ej. ticket no encontrado) nunca es error de stock aunque el texto coincida.
          if (/stock|disponible|inventario/i.test(message) && !isNotFoundError(error)) {
            this.inventoryByBranchFacade.loadMyBranchInventory();
          }
        },
      });
  }

  onLoadMore(): void {
    // Paginación local no necesaria; mi-sucursal trae todo el inventario
  }
}

function toSalesProduct(item: InventoryItem): SalesProduct {
  return {
    id: item.idProducto,
    nombre: item.nombre,
    descripcion: item.clave,
    precio: item.precioSucursal ?? item.precioBase,
    stock: item.cantidad,
    codigoBarras: item.codigoBarras,
    imagen: 'assets/images/Refaccionaria.webp',
    hasSucursalPrice: item.precioSucursal !== null,
  };
}

/** Recorre la cadena `cause` buscando un 404 (p. ej. ticket no encontrado). */
function isNotFoundError(error: unknown): boolean {
  let current: unknown = error;
  while (current instanceof Error) {
    const cause: unknown = (current as { cause?: unknown }).cause;
    if (cause instanceof HttpErrorResponse) return cause.status === 404;
    if (!(cause instanceof Error)) return false;
    current = cause;
  }
  return false;
}
