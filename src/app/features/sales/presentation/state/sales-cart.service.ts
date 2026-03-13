import { Injectable, computed, signal } from '@angular/core';

import {
  SalesCartItem,
  SalesPaymentMethod,
  SalesProduct,
} from '../models/sales-ui.models';

@Injectable()
export class SalesCartService {
  private readonly _cart = signal<SalesCartItem[]>([
    {
      productId: 'p1',
      nombre: 'Filtro de aceite',
      precio: 120,
      imagen: 'assets/images/filtro.jpg',
      qty: 1,
    },
  ]);
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
}
