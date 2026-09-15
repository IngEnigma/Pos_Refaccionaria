export interface NotificationCreateRequestDto {
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
}
