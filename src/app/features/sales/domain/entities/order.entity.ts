import { Money } from '../value-objects/money.value';
import { Quantity } from '../value-objects/quantity.value';

export interface OrderItemProps {
  productId: number;
  price: number;
  quantity: number;
}

export class OrderItem {
  readonly productId: number;
  readonly price: Money;
  readonly quantity: Quantity;

  constructor(props: OrderItemProps) {
    this.productId = props.productId;
    this.price = Money.fromNumber(props.price, 'OrderItem.price');
    this.quantity = Quantity.fromNumber(props.quantity, 'OrderItem.quantity');
  }

  get subtotal(): Money {
    return Money.fromNumber(+(this.price.value * this.quantity.value).toFixed(2), 'OrderItem.subtotal');
  }
}

export class Order {
  private readonly _items: OrderItem[] = [];
  private readonly _ivaRate = 0.16;
  private _discount = 0;

  get items(): readonly OrderItem[] {
    return this._items;
  }

  get discount(): Money {
    return Money.fromNumber(this._discount, 'Order.discount');
  }

  /** El precio de catálogo ya incluye IVA: total = Σ(precio × cantidad) − descuento, igual que el backend. */
  get total(): Money {
    const sum = this._items.reduce((acc, item) => acc + item.subtotal.value, 0);
    return Money.fromNumber(this.round2(Math.max(0, sum - this._discount)), 'Order.total');
  }

  /** Base sin IVA: total / 1.16. */
  get subtotal(): Money {
    return Money.fromNumber(this.round2(this.total.value / (1 + this._ivaRate)), 'Order.subtotal');
  }

  /** IVA incluido en el total. */
  get iva(): Money {
    return Money.fromNumber(this.round2(this.total.value - this.subtotal.value), 'Order.iva');
  }

  private round2(value: number): number {
    return +value.toFixed(2);
  }

  setDiscount(amount: number): void {
    if (amount < 0) throw new Error('Discount cannot be negative');
    this._discount = amount;
  }

  addItem(props: OrderItemProps): void {
    const existing = this._items.find(i => i.productId === props.productId);
    if (existing) {
      const newQty = existing.quantity.value + props.quantity;
      const index = this._items.indexOf(existing);
      this._items[index] = new OrderItem({ ...props, quantity: Math.min(999, newQty) });
    } else {
      this._items.push(new OrderItem(props));
    }
  }

  validate(): void {
    if (this._items.length === 0) {
      throw new Error('El carrito está vacío.');
    }
  }
}
