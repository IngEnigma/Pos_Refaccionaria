export interface DetailedSaleDTO {
  id: number;
  id_inventario: number | null;
  fecha: string;
  total: string;
  detalles: Array<{
    id: number;
    producto: {
      id: number;
      nombre: string;
      precio_venta: string;
      codigo_barras: string;
    };
    cantidad: number;
    subtotal: string;
  }>;
}
