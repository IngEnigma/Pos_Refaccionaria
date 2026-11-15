export interface UserCreateRequestDto {
  username: string;
  password: string;
  email: string;
  is_active: boolean;
  id_sucursal: number;
  rol: 'cajero' | 'encargado' | 'admin';
}
