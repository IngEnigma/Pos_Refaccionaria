export interface SalesProduct {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
}

export interface SalesCartItem {
  productId: string;
  nombre: string;
  precio: number;
  imagen: string;
  qty: number;
}

export type SalesPaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';
