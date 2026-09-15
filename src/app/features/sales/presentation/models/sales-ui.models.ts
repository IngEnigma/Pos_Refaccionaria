import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';

export interface SalesProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  codigoBarras: string;
  imagen: string;
  hasSucursalPrice: boolean;
}

export interface SalesCartItem {
  productId: number;
  nombre: string;
  precio: number;
  imagen: string;
  qty: number;
  stock: number;
}

export type SalesPaymentMethod = PaymentMethod;
