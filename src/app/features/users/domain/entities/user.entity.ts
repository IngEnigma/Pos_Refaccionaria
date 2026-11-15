export interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
  branchId: number | null;
  role: 'cajero' | 'encargado' | 'admin';
}
