import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap, throwError } from 'rxjs';

import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import {
  SalesCartItem,
  SalesPaymentMethod,
  SalesProduct,
} from '../models/sales-ui.models';

@Injectable()
export class SalesCartService {
  private readonly facade = inject(SalesFacade);
  private readonly sessionState = inject(SessionStateService);
  private readonly _cart = signal<SalesCartItem[]>([]);
  private readonly _selectedPayment = signal<SalesPaymentMethod | null>(null);
  private readonly _descuento = signal(0);
  private readonly _ivaRate = 0.16;

  readonly cart = this._cart.asReadonly();
  readonly selectedPayment = this._selectedPayment.asReadonly();
  readonly descuento = this._descuento.asReadonly();
  readonly ivaRate = this._ivaRate;

  readonly subtotal = computed(() =>
    this.cart().reduce((sum, it) => sum + it.precio * it.qty, 0),
  );

  readonly iva = computed(() => {
    const base = Math.max(0, this.subtotal() - this.descuento());
    return +(base * this.ivaRate).toFixed(2);
  });

  readonly total = computed(() => {
    const base = Math.max(0, this.subtotal() - this.descuento());
    return +(base + this.iva()).toFixed(2);
  });

  addToCart(product: SalesProduct): void {
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
          },
        ];
      }
      return items.map((item) =>
        item.productId === product.id
          ? { ...item, qty: Math.min(999, item.qty + 1) }
          : item,
      );
    });
  }

  increaseQty(item: SalesCartItem): void {
    this._cart.update((items) =>
      items.map((current) =>
        current.productId === item.productId
          ? { ...current, qty: Math.min(999, current.qty + 1) }
          : current,
      ),
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

  confirmSale(): Observable<void> {
    const cartItems = this.cart();
    if (cartItems.length === 0) {
      return throwError(() => new Error('El carrito está vacío.'));
    }

    const paymentMethod = this.selectedPayment();
    if (!paymentMethod) {
      return throwError(() => new Error('Selecciona un método de pago.'));
    }

    const session = this.sessionState.getSession();
    const userId = session ? Number(session.userId) : NaN;
    if (!Number.isFinite(userId)) {
      return throwError(() => new Error('No se pudo determinar el usuario actual.'));
    }

    const productos = cartItems.map((item) => ({
      id: item.productId,
      cantidad: item.qty,
    }));

    return this.facade
      .createSale({
        idUsuario: userId,
        idMetodoPago: paymentMethod.id,
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
