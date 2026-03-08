import { SupplierCreateRequestDto } from '@features/suppliers/application/dtos/supplier-create-request.dto';
import { SupplierResponseDto } from '@features/suppliers/application/dtos/supplier-response.dto';
import { SupplierUpdateRequestDto } from '@features/suppliers/application/dtos/supplier-update-request.dto';
import { Supplier } from '@features/suppliers/domain/entities/supplier.entity';
import {
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from '@features/suppliers/domain/repository/supplier-repository';

export class SupplierMapper {
  static fromResponseDto(dto: SupplierResponseDto): Supplier {
    return {
      id: dto.id,
      nombre: dto.nombre,
      telefono: dto.telefono,
      correo: dto.correo,
      direccion: dto.direccion,
    };
  }

  static toCreateRequestDto(payload: CreateSupplierPayload): SupplierCreateRequestDto {
    return {
      nombre: payload.nombre,
      telefono: payload.telefono,
      correo: payload.correo,
      direccion: payload.direccion,
    };
  }

  static toUpdateRequestDto(payload: UpdateSupplierPayload): SupplierUpdateRequestDto {
    return {
      nombre: payload.nombre,
      telefono: payload.telefono,
      correo: payload.correo,
      direccion: payload.direccion,
    };
  }
}
