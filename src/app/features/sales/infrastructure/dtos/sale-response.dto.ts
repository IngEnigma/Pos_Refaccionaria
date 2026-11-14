export interface SaleResponseDto {
  id: number;
  id_usuario: number | null;
  id_inventario: number | null;
  id_metodo_pago: number | null;
  total: string;
  fecha: string | null;
}
