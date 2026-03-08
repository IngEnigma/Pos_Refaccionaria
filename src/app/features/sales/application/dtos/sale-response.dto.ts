export interface SaleResponseDto {
  id: number;
  id_usuario: number | null;
  id_metodo_pago: number | null;
  id_metodoPago?: number | null;
  total: number;
  fecha: string;
}
