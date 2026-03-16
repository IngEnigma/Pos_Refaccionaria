import { Money } from '@features/sales/domain/value-objects/money.value';
import { SaleDate } from '@features/sales/domain/value-objects/sale-date.value';

export interface Sale {
  id: number;
  idUsuario: number | null;
  idMetodoPago: number | null;
  total: number;
  fecha: string | null;
}

export class SaleFactory {
  static fromPrimitives(data: Sale): Sale {
    Money.fromNumber(data.total, 'Sale.total');
    SaleDate.fromNullable(data.fecha, 'Sale.fecha');

    return { ...data };
  }
}
