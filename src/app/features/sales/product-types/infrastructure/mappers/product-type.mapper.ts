import { ProductTypeCreateRequestDto } from '@features/sales/product-types/infrastructure/dtos/product-type-create-request.dto';
import { ProductTypeResponseDto } from '@features/sales/product-types/infrastructure/dtos/product-type-response.dto';
import { ProductTypeUpdateRequestDto } from '@features/sales/product-types/infrastructure/dtos/product-type-update-request.dto';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';
import {
  CreateProductTypePayload,
  UpdateProductTypePayload,
} from '@features/sales/product-types/domain/repository/product-type-repository';

export class ProductTypeMapper {
  static fromResponseDto(dto: ProductTypeResponseDto): ProductType {
    return {
      id: dto.id,
      nombre: dto.nombre,
    };
  }

  static toCreateRequestDto(payload: CreateProductTypePayload): ProductTypeCreateRequestDto {
    return {
      nombre: payload.nombre,
    };
  }

  static toUpdateRequestDto(payload: UpdateProductTypePayload): ProductTypeUpdateRequestDto {
    return {
      nombre: payload.nombre,
    };
  }
}
