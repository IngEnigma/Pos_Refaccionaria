import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap, throwError } from 'rxjs';


import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { Order } from '@features/sales/domain/entities/order.entity';
import {
  SalesCartItem,
  SalesPaymentMethod,
  SalesProduct,
} from '../models/sales-ui.models';

@Injectable()
export class SalesCartService {
  private readonly facade = inject(SalesFacade);

  private readonly _cart = signal<SalesCartItem[]>([]);
  private readonly _selectedPayment = signal<SalesPaymentMethod | null>(null);
  private readonly _descuento = signal(0);
  private readonly _ventaInventarioId = signal<number | null>(null);

  readonly cart = this._cart.asReadonly();
  readonly selectedPayment = this._selectedPayment.asReadonly();
  readonly descuento = this._descuento.asReadonly();
  readonly ventaInventarioId = this._ventaInventarioId.asReadonly();

  readonly order = computed(() => {
    const o = new Order();
    o.setDiscount(this.descuento());
    this.cart().forEach(item => 
      o.addItem({ productId: item.productId, price: item.precio, quantity: item.qty })
    );
    return o;
  });

  readonly subtotal = computed(() => this.order().subtotal.value);
  readonly iva = computed(() => this.order().iva.value);
  readonly total = computed(() => this.order().total.value);

  addToCart(product: SalesProduct): void {
    if (product.stock !== 0 && product.stock <= 0) return;

    this._cart.update((items) => {
      const exists = items.find((c) => c.productId === product.id);
      if (!exists) {
        return [
          ...items,
          {
            productId: product.id,
            nombre: product.nombre,
            precio: product.precio,
            imagen: product.imagen,
            qty: 1,
            stock: product.stock,
          },
        ];
      }

      return items.map((item) => {
        if (item.productId !== product.id) return item;
        const newQty = item.qty + 1;
        if (item.stock === 0) return { ...item, qty: newQty };
        return newQty <= item.stock
          ? { ...item, qty: newQty }
          : item;
      });
    });
  }

  increaseQty(item: SalesCartItem): void {
    this._cart.update((items) =>
      items.map((current) => {
        if (current.productId !== item.productId) return current;
        const newQty = current.qty + 1;
        if (current.stock === 0) return { ...current, qty: newQty };
        return newQty <= current.stock
          ? { ...current, qty: newQty }
          : current;
      }),
    );
  }

  decreaseQty(item: SalesCartItem): void {
    this._cart.update((items) =>
      items.map((current) => {
        if (current.productId !== item.productId) return current;
        if (current.qty <= 1) return current;
        return { ...current, qty: current.qty - 1 };
      }),
    );
  }

  removeItem(item: SalesCartItem): void {
    this._cart.update((items) =>
      items.filter((c) => c.productId !== item.productId),
    );
  }

  selectPayment(method: SalesPaymentMethod): void {
    this._selectedPayment.set(method);
  }

  clearCart(): void {
    this._cart.set([]);
    this._selectedPayment.set(null);
    this._descuento.set(0);
  }

  setVentaInventarioId(idInventario: number | null): void {
    this._ventaInventarioId.set(idInventario);
  }

  confirmSale(): Observable<void> {
    const cartItems = this.cart();
    if (cartItems.length === 0) {
      return throwError(() => new Error('El carrito está vacío.'));
    }

    const paymentMethod = this.selectedPayment();
    if (!paymentMethod) {
      return throwError(() => new Error('Selecciona un método de pago.'));
    }

    const inventarioId = this.ventaInventarioId();
    if (inventarioId == null) {
      return throwError(() => new Error('No hay inventario asignado para esta sucursal.'));
    }

    const productos = cartItems.map((item) => ({
      id: item.productId,
      cantidad: item.qty,
    }));

    return this.facade
      .createSale({
        idMetodoPago: paymentMethod.id,
        idInventario: inventarioId,
        productos,
      })
      .pipe(
        tap(() => {
          this.clearCart();
          this.facade.loadSales();
        }),
        map(() => undefined),
      );
  }
}
