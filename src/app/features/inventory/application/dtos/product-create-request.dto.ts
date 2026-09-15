export interface ProductCreateRequestDto {
  id_tipo: number | null;
  id_proveedor: number | null;
  clave: string;
  nombre: string;
  descripcion: string | null;
  codigo_barras: string;
  precio_venta: number;
  marca: string;
  costo: number;
  codigoSAT: string | null;
}
