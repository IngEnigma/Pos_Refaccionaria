import { ChangeDetectionStrategy, Component, OnInit, inject, effect } from '@angular/core';

import { ToastService } from '@app/shared/ui/components/toast/toast.service';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { CategorySliderComponent } from '@features/sales/presentation/components/category-slider/category-slider.component';
import { CartPanelComponent } from '@features/sales/presentation/components/cart-panel/cart-panel.component';
import { ProductGridComponent } from '@features/sales/presentation/components/product-grid/product-grid.component';
import {
  SalesCartItem,
  SalesPaymentMethod,
  SalesProduct,
} from '@features/sales/presentation/models/sales-ui.models';
import { SalesCartService } from '@features/sales/presentation/state/sales-cart.service';

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
  readonly facade = inject(SalesFacade);
  readonly toastService = inject(ToastService);
  readonly cartService = inject(SalesCartService);

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

  
  readonly categorias: string[] = [
    'Frenos',
    'Suspensión',
    'Motor',
    'Aceites',
    'Filtros',
    'Llantas',
    'Herramientas',
    'Accesorios'
  ];

  // Productos hardcodeados acá
  readonly productos: SalesProduct[] = [
    {
      id: 'p1',
      nombre: 'Filtro de aceite',
      descripcion: 'Filtro 1234 • 2.5L',
      precio: 120,
      stock: 15,
      imagen: 'assets/images/filtro.jpg',
    },
    {
      id: 'p2',
      nombre: 'Bujía NGK',
      descripcion: 'Modelo BPR6E • 4 piezas',
      precio: 240,
      stock: 32,
      imagen: 'assets/images/bujia.jpg',
    },
    {
      id: 'p3',
      nombre: 'Líquido de frenos DOT4',
      descripcion: '1 L • Uso universal',
      precio: 95,
      stock: 20,
      imagen: 'assets/images/liquido.jpg',
    },
    {
      id: 'p4',
      nombre: 'Amortiguador delantero',
      descripcion: 'Nissan Versa 2017',
      precio: 860,
      stock: 8,
      imagen: 'assets/images/amortiguador.jpg',
    },
  ];

  readonly cartItems = this.cartService.cart;
  readonly descuento = this.cartService.descuento;
  readonly subtotal = this.cartService.subtotal;
  readonly iva = this.cartService.iva;
  readonly total = this.cartService.total;
  readonly selectedPayment = this.cartService.selectedPayment;

  onAddToCart(product: SalesProduct): void {
    this.cartService.addToCart(product);
  }

  onSelectCategory(_category: string): void {
    // Placeholder for future category filtering.
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

  //Proceso de transacción:

  processTransaction() {

  }
}
