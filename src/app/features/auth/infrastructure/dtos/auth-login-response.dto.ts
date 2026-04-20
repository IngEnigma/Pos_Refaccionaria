export interface LoginResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    username: string;
    isAdmin: boolean;
    isStaff: boolean;
  };
}
