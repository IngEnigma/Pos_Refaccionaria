export interface PriceHistoryResponseDto {
  id: number;
  id_producto: number;
  id_sucursal: number;
  precio_venta: string;
  vigente_desde: string;
  activo: boolean;
}
