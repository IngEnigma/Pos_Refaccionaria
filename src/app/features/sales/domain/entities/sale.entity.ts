import { Money } from '@features/sales/domain/value-objects/money.value';
import { SaleDate } from '@features/sales/domain/value-objects/sale-date.value';

export interface SaleProps {
  id: number;
  idUsuario: number | null;
  idInventario: number | null;
  idMetodoPago: number | null;
  total: number;
  fecha: string | null;
}

export class Sale {
  readonly id: number;
  readonly idUsuario: number | null;
  readonly idInventario: number | null;
  readonly idMetodoPago: number | null;
  readonly total: Money;
  readonly fecha: SaleDate | null;

  constructor(props: SaleProps) {
    this.id = props.id;
    this.idUsuario = props.idUsuario;
    this.idInventario = props.idInventario;
    this.idMetodoPago = props.idMetodoPago;
    this.total = Money.fromNumber(props.total, 'Sale.total');
    this.fecha = SaleDate.fromNullable(props.fecha, 'Sale.fecha');
  }
}

export class SaleFactory {
  static fromPrimitives(data: SaleProps): Sale {
    return new Sale(data);
  }
}
