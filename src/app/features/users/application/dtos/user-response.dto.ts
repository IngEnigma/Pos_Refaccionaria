export interface UserResponseDto {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  id_sucursal: number | null;
  rol: 'cajero' | 'encargado' | 'admin';
}
