export interface SaleResponseDto {
  id: number;
  id_usuario: number | null;
  id_metodo_pago: number | null;
  id_sucursal: number | null;
  id_cliente: number | null;
  estado: string;
  /** Base sin IVA; `total = subtotal + iva`. */
  subtotal: string;
  iva: string;
  total: string;
  fecha: string | null;
}
