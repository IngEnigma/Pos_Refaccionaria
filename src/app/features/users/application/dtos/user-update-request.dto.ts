export interface UserUpdateRequestDto {
  username?: string;
  password?: string;
  email?: string;
  is_active?: boolean;
  /** Solo staff; el backend lo ignora para encargado. */
  id_sucursal?: number;
  rol?: 'cajero' | 'encargado' | 'admin';
}
