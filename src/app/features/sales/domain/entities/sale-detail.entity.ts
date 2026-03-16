import { Money } from '@features/sales/domain/value-objects/money.value';
import { Quantity } from '@features/sales/domain/value-objects/quantity.value';

export interface SaleDetail {
  id: number;
  productId: number;
  saleId: number;
  subtotal: number;
  cantidad: number;
}

export class SaleDetailFactory {
  static fromPrimitives(data: SaleDetail): SaleDetail {
    Money.fromNumber(data.subtotal, 'SaleDetail.subtotal');
    Quantity.fromNumber(data.cantidad, 'SaleDetail.cantidad');

    return { ...data };
  }
}
