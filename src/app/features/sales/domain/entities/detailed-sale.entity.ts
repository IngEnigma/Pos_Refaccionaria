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
  fecha: string;
  total: number;
  detalles: DetailedSaleItem[];
}

export class DetailedSale {
  readonly id: number;
  readonly fecha: SaleDate;
  readonly total: Money;
  readonly detalles: DetailedSaleItem[];

  constructor(props: DetailedSaleProps) {
    this.id = props.id;
    this.fecha = SaleDate.fromPrimitive(props.fecha, 'DetailedSale.fecha');
    this.total = Money.fromNumber(props.total, 'DetailedSale.total');
    this.detalles = props.detalles;
  }
}
