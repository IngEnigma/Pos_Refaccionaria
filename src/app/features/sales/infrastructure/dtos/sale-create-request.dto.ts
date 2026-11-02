export interface SaleCreateRequestDto {
  id_metodoPago: number;
  /** Opcional: ausente = venta para Público general (NULL en backend). */
  id_cliente?: number;
}
