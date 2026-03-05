export interface LoginResponseDto {
  refreshToken: string;
  accessToken: string;
  user: {
    id: string;
    isAdmin: boolean;
    isStaff: boolean;
  };
}