import { PaginatedResponse } from '@core/models/pagination.model';
import { ProductCreateRequestDto } from '@features/inventory/application/dtos/product-create-request.dto';
import {
  ProductResponseDto,
  ProductStockResponseDto,
} from '@features/inventory/application/dtos/product-response.dto';
import { ProductUpdateRequestDto } from '@features/inventory/application/dtos/product-update-request.dto';
import { Product, ProductStock } from '@features/inventory/domain/entities/product.entity';
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
      clave: dto.clave,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      codigoBarras: dto.codigo_barras,
      precioVenta: Number(dto.precio_venta),
      marca: dto.marca,
      costo: Number(dto.costo),
      codigoSat: dto.codigoSAT ?? null,
    };
  }

  static fromStockResponseDto(dto: ProductStockResponseDto): ProductStock {
    return {
      ...this.fromResponseDto(dto),
      cantidad: dto.cantidad,
      precioSucursal: dto.precio_sucursal ? Number(dto.precio_sucursal) : null,
      precioBase: Number(dto.precio_base),
      vigenteDesde: dto.vigente_desde,
      idSucursal: dto.id_sucursal,
    };
  }

  static mapPaginatedResponse(dto: any): PaginatedResponse<Product> {
    if (Array.isArray(dto)) {
      return {
        data: dto.map((item) => this.fromResponseDto(item)),
        total: dto.length,
        page: 1,
        limit: dto.length,
      };
    }

    const data = dto.results || dto.data || dto.items || [];
    
    return {
      data: data.map((item: any) => this.fromResponseDto(item)),
      total: dto.total || data.length || 0,
      page: dto.page || dto.currentPage || 1,
      limit: dto.page_size || dto.limit || dto.pageSize || 15,
    };
  }

  static mapStockPaginatedResponse(dto: any): PaginatedResponse<ProductStock> {
    if (Array.isArray(dto)) {
      return {
        data: dto.map((item) => this.fromStockResponseDto(item)),
        total: dto.length,
        page: 1,
        limit: dto.length,
      };
    }

    const data = dto.results || dto.data || dto.items || [];
    
    return {
      data: data.map((item: any) => this.fromStockResponseDto(item)),
      total: dto.total || data.length || 0,
      page: dto.page || dto.currentPage || 1,
      limit: dto.page_size || dto.limit || dto.pageSize || 15,
    };
  }

  static toCreateRequestDto(payload: CreateProductPayload): ProductCreateRequestDto {
    return {
      id_tipo: payload.idTipo,
      id_proveedor: payload.idProveedor,
      clave: payload.clave,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      codigo_barras: payload.codigoBarras,
      precio_venta: payload.precioVenta,
      marca: payload.marca,
      costo: payload.costo,
      codigoSAT: payload.codigoSat,
    };
  }

  static toUpdateRequestDto(payload: UpdateProductPayload): ProductUpdateRequestDto {
    return {
      id_tipo: payload.idTipo,
      id_proveedor: payload.idProveedor,
      clave: payload.clave,
      nombre: payload.nombre,
      descripcion: payload.descripcion,
      codigo_barras: payload.codigoBarras,
      precio_venta: payload.precioVenta,
      marca: payload.marca,
      costo: payload.costo,
      codigoSAT: payload.codigoSat,
    };
  }
}
