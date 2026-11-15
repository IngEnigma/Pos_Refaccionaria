export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    username: string;
    isAdmin: boolean;
    isStaff: boolean;
    /** 'cajero' | 'encargado' | 'admin'; define los permisos en el backend. */
    rol?: string;
    /** No se usa: la sucursal se carga del perfil en MainLayout (también al recargar). */
    id_sucursal?: number | null;
  };
}
