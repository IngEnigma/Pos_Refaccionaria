export interface SaleUpdateRequestDto {
  id_usuario?: number | null;
  id_metodoPago?: number | null;
  total?: number;
  fecha?: string;
}
