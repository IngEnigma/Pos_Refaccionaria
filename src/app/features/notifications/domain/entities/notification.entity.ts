export interface Notification {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  leida: boolean;
  creadoEn: Date;
}
