export interface SaleResponseDto {
  id: number;
  id_usuario: number | null;
  id_metodoPago: number | null;
  total: string;
  fecha: string | null;
}
