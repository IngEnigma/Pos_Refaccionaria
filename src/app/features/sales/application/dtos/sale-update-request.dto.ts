export interface SaleUpdateRequestDto {
  id_usuario?: number | null;
  id_metodo_pago?: number | null;
  total?: number;
  fecha?: string;
}
