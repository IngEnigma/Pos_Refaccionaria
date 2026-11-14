export interface SaleDetailItemRequestDto {
  producto: number;
  cantidad: number;
}

export interface SaleCreateRequestDto {
  id_metodoPago: number;
  detalles: SaleDetailItemRequestDto[];
}
