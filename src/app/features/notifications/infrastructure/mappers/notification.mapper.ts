import { NotificationResponseDto } from '@features/notifications/application/dtos/notification-response.dto';
import { Notification } from '@features/notifications/domain/entities/notification.entity';

export class NotificationMapper {
  static fromResponseDto(dto: NotificationResponseDto): Notification {
    return {
      id: dto.id,
      titulo: dto.titulo,
      mensaje: dto.mensaje,
      tipo: dto.tipo,
      leida: dto.leida,
      creadoEn: new Date(dto.creado_en),
    };
  }
}
