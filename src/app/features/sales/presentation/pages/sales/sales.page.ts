import { ChangeDetectionStrategy, Component, OnInit, inject, effect, signal, computed } from '@angular/core';

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

  readonly productos = computed<SalesProduct[]>(() => {
    const selectedId = this.selectedCategoryId();
    const products = this.inventoryFacade.products();
    const filtered =
      selectedId && selectedId > 0 ? products.filter((product) => product.idTipo === selectedId) : products;

    return filtered.map((product) => ({
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

  processTransaction() {
    this.cartService
      .confirmSale()
      .subscribe({
        next: () => {
          this.toastService.success('Venta registrada correctamente.');
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
}
