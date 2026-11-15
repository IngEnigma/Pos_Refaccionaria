export interface SaleCreateRequestDto {
  id_metodo_pago: number;
  /** Opcional: ausente = venta para Público general (NULL en backend). */
  id_cliente?: number;
  /** Con líneas, el backend crea cabecera + detalles + salidas de stock en una sola transacción. */
  detalles?: Array<{ id_producto: number; cantidad: number }>;
}
