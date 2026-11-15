import { Money } from './../value-objects/money.value';
import { SaleDate } from './../value-objects/sale-date.value';
import { Quantity } from './../value-objects/quantity.value';

export interface DetailedSaleItem {
  id: number;
  producto: {
    id: number;
    nombre: string;
    precioVenta: Money;
    codigoBarras: string;
  };
  cantidad: Quantity;
  subtotal: Money;
}

export interface DetailedSaleProps {
  id: number;
  idInventario: number | null;
  fecha: string;
  /** Base sin IVA; `total = subtotal + iva` (lo calcula el backend). */
  subtotal: number;
  iva: number;
  total: number;
  detalles: DetailedSaleItem[];
}

export class DetailedSale {
  readonly id: number;
  readonly idInventario: number | null;
  readonly fecha: SaleDate;
  readonly subtotal: Money;
  readonly iva: Money;
  readonly total: Money;
  readonly detalles: DetailedSaleItem[];

  constructor(props: DetailedSaleProps) {
    this.id = props.id;
    this.idInventario = props.idInventario;
    this.fecha = SaleDate.fromPrimitive(props.fecha, 'DetailedSale.fecha');
    this.subtotal = Money.fromNumber(props.subtotal, 'DetailedSale.subtotal');
    this.iva = Money.fromNumber(props.iva, 'DetailedSale.iva');
    this.total = Money.fromNumber(props.total, 'DetailedSale.total');
    this.detalles = props.detalles;
  }
}
