export interface LoginResponseDto {
  refreshToken?: string;
  accessToken?: string;
  refresh?: string;
  access?: string;
  user: {
    id: number;
    username: string;
    isAdmin: boolean;
    isStaff: boolean;
  };
}
