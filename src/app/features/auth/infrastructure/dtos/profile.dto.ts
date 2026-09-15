export interface ProfileResponseDto {
  id: number;
  id_usuario: number;
  id_sucursal: number | null;
}

export interface UpdateSucursalRequestDto {
  id_sucursal: number | null;
}
