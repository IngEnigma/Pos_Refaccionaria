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
  };
}
