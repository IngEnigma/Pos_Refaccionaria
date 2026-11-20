import { ClientCreateRequestDto } from '@features/clients/application/dtos/client-create-request.dto';
import { ClientResponseDto } from '@features/clients/application/dtos/client-response.dto';
import { ClientUpdateRequestDto } from '@features/clients/application/dtos/client-update-request.dto';
import { Client } from '@features/clients/domain/entities/client.entity';
import {
  CreateClientPayload,
  UpdateClientPayload,
} from '@features/clients/domain/repository/client-repository';

/** H-F3-1: apellido_materno, direccion y rfc son CharField sin null en el backend: null → ''. */
const texto = <T>(v: T | null): T | '' => (v === null ? '' : v);

export class ClientMapper {
  static fromResponseDto(dto: ClientResponseDto): Client {
    return {
      id: dto.id,
      idSucursal: dto.id_sucursal,
      nombre: dto.nombre,
      apellidoPaterno: dto.apellido_paterno,
      apellidoMaterno: dto.apellido_materno,
      telefono: dto.telefono,
      correo: dto.correo,
      direccion: dto.direccion,
      rfc: dto.rfc,
    };
  }

  static toCreateRequestDto(payload: CreateClientPayload): ClientCreateRequestDto {
    return {
      id_sucursal: payload.idSucursal,
      nombre: payload.nombre,
      apellido_paterno: payload.apellidoPaterno,
      apellido_materno: payload.apellidoMaterno ?? '',
      telefono: payload.telefono,
      correo: payload.correo ?? null,
      direccion: payload.direccion ?? '',
      rfc: payload.rfc ?? '',
    };
  }

  static toUpdateRequestDto(payload: UpdateClientPayload): ClientUpdateRequestDto {
    return {
      id_sucursal: payload.idSucursal,
      nombre: payload.nombre,
      apellido_paterno: payload.apellidoPaterno,
      apellido_materno: texto(payload.apellidoMaterno),
      telefono: payload.telefono,
      correo: payload.correo,
      direccion: texto(payload.direccion),
      rfc: texto(payload.rfc),
    };
  }
}
