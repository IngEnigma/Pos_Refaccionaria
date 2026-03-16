export interface SaleCreateRequestDto {
  id_usuario: number;
  id_metodoPago: number;
  productos: Array<{
    id: number;
    cantidad: number;
  }>;
}
