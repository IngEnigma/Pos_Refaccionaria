export interface SaleTicketDto {
  folio: number;
  fecha: string | null;
  vendedor: string | null;
  metodo_pago: string | null;
  sucursal: string | null;
  productos: Array<{
    nombre: string;
    cantidad: number;
    precio_unitario: string;
    subtotal: string;
  }>;
  /** Base sin IVA; `total = subtotal + iva`. */
  subtotal: string;
  iva: string;
  total: string;
}
