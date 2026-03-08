import { ProductCreateRequestDto } from '@features/inventory/application/dtos/product-create-request.dto';
import { ProductResponseDto } from '@features/inventory/application/dtos/product-response.dto';
import { ProductUpdateRequestDto } from '@features/inventory/application/dtos/product-update-request.dto';
import { Product } from '@features/inventory/domain/entities/product.entity';
import {
  CreateProductPayload,
  UpdateProductPayload,
} from '@features/inventory/domain/repository/product-repository';

export class ProductMapper {
  static fromResponseDto(dto: ProductResponseDto): Product {
    return {
      id: dto.id,
      idTipo: dto.id_tipo,
      idProveedor: dto.id_proveedor,
      idMovimientos: dto.id_movimientos,
      clave: dto.clave,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      codigoBarras: dto.codigo_barras,
      precioVenta: Number(dto.precio_venta),
      marca: dto.marca,
      existencia: dto.existencia,
      costo: Number(dto.costo),
      codigoSat: dto.codigo_sat ?? dto.codigoSAT ?? null,
    };
  }

  static toCreateRequestDto(payload: CreateProductPayload): ProductCreateRequestDto {
    return {
      id_tipo: payload.idTipo,
      id_proveedor: payload.idProveedor,
      id_movimientos: payload.idMovimientos,
      clave: payload.clave,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      codigo_barras: payload.codigoBarras,
      precio_venta: payload.precioVenta,
      marca: payload.marca,
      existencia: payload.existencia,
      costo: payload.costo,
      codigo_sat: payload.codigoSat,
    };
  }

  static toUpdateRequestDto(payload: UpdateProductPayload): ProductUpdateRequestDto {
    return {
      id_tipo: payload.idTipo,
      id_proveedor: payload.idProveedor,
      id_movimientos: payload.idMovimientos,
      clave: payload.clave,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      codigo_barras: payload.codigoBarras,
      precio_venta: payload.precioVenta,
      marca: payload.marca,
      existencia: payload.existencia,
      costo: payload.costo,
      codigo_sat: payload.codigoSat,
    };
  }
}
