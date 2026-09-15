export interface Product {
  id: number;
  idTipo: number | null;
  idProveedor: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigoBarras: string;
  precioVenta: number;
  marca: string;
  costo: number;
  codigoSat: string | null;
}

export interface ProductStock extends Product {
  cantidad: number;
  precioSucursal: number | null;
  precioBase: number;
  vigenteDesde: string | null;
  idSucursal: number;
}
