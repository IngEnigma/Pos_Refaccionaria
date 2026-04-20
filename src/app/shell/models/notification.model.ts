export interface NotificationItem {
  id: number;
  title: string;
  description?: string;
  read?: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
  icon?: string;
}
