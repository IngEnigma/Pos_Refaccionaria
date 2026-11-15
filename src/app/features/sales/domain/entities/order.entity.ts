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
    return Money.fromNumber(Money.round2(this.price.value * this.quantity.value), 'OrderItem.subtotal');
  }
}

export class Order {
  private readonly _items: OrderItem[] = [];
  private readonly _ivaRate = 0.16;

  get items(): readonly OrderItem[] {
    return this._items;
  }

  /** Base sin IVA: Σ(precio × cantidad). El precio de catálogo no incluye IVA. */
  get subtotal(): Money {
    const sum = this._items.reduce((acc, item) => acc + item.subtotal.value, 0);
    return Money.fromNumber(Money.round2(sum), 'Order.subtotal');
  }

  /** IVA 16 % sobre el subtotal, igual que el backend. */
  get iva(): Money {
    return Money.fromNumber(Money.round2(this.subtotal.value * this._ivaRate), 'Order.iva');
  }

  /** total = subtotal + IVA, igual que el backend. */
  get total(): Money {
    return Money.fromNumber(Money.round2(this.subtotal.value + this.iva.value), 'Order.total');
  }

  addItem(props: OrderItemProps): void {
    const existing = this._items.find(i => i.productId === props.productId);
    const quantity = Math.min(999, props.quantity + (existing?.quantity.value ?? 0));
    const item = new OrderItem({ ...props, quantity });
    if (existing) this._items[this._items.indexOf(existing)] = item;
    else this._items.push(item);
  }

  validate(): void {
    if (this._items.length === 0) {
      throw new Error('El carrito está vacío.');
    }
  }
}
