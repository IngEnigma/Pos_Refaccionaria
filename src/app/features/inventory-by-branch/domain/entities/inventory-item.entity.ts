export interface InventoryItem {
  id: number;
  idProducto: number;
  nombre: string;
  clave: string;
  marca: string;
  codigoBarras: string;
  precioVenta: number;
  precioSucursal: number | null;
  precioBase: number;
  costo: number;
  cantidad: number;
}
