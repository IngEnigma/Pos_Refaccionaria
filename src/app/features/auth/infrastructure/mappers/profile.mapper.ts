import { UserProfile } from '@features/auth/domain/entities/user-profile.entity';
import { ProfileResponseDto } from '@features/auth/infrastructure/dtos/profile.dto';

export class ProfileMapper {
  static fromDto(dto: ProfileResponseDto): UserProfile {
    return {
      id: dto.id,
      idUsuario: dto.id_usuario,
      idSucursal: dto.id_sucursal,
    };
  }
}
