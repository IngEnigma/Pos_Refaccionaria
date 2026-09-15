import { BranchCreateRequestDto } from '@features/branches/application/dtos/branch-create-request.dto';
import { BranchResponseDto } from '@features/branches/application/dtos/branch-response.dto';
import { BranchUpdateRequestDto } from '@features/branches/application/dtos/branch-update-request.dto';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';

export class BranchMapper {
  static fromResponseDto(dto: BranchResponseDto): Branch {
    return {
      id: dto.id,
      nombreSucursal: dto.nombre_sucursal ?? '',
      codigoSucursal: dto.codigo_sucursal ?? '',
      ubicacion: dto.ubicacion ?? '',
      codigoPostal: dto.codigo_postal ?? '',
      numeroTelefono: dto.numero_telefono ?? '',
      correoElectronico: dto.correo_electronico ?? '',
    };
  }

  static toCreateRequestDto(payload: CreateBranchPayload): BranchCreateRequestDto {
    return {
      nombre_sucursal: payload.nombreSucursal,
      ubicacion: payload.ubicacion,
      codigo_postal: payload.codigoPostal,
      numero_telefono: payload.numeroTelefono,
      correo_electronico: payload.correoElectronico,
    };
  }

  static toUpdateRequestDto(payload: UpdateBranchPayload): BranchUpdateRequestDto {
    return {
      nombre_sucursal: payload.nombreSucursal,
      ubicacion: payload.ubicacion,
      codigo_postal: payload.codigoPostal,
      numero_telefono: payload.numeroTelefono,
      correo_electronico: payload.correoElectronico,
    };
  }
}
