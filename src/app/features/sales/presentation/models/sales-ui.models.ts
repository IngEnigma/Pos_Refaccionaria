import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';

export interface SalesProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
}

export interface SalesCartItem {
  productId: number;
  nombre: string;
  precio: number;
  imagen: string;
  qty: number;
}

export type SalesPaymentMethod = PaymentMethod;
