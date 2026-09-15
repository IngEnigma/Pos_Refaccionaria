export interface SaleCreateRequestDto {
  id_inventario: number;
  id_metodoPago: number;
  productos: Array<{
    id: number;
    cantidad: number;
  }>;
}
