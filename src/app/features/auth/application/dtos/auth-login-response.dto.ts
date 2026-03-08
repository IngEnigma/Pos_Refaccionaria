export interface LoginResponseDto {
  refreshToken?: string;
  accessToken?: string;
  refresh?: string;
  access?: string;
  user: {
    id: string | number;
    isAdmin: boolean;
    isStaff: boolean;
  };
}
