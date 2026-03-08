export interface SidebarNavItem {
  readonly id: string;
  readonly label: string;
  readonly iconPath: string;
  readonly route: string;
  readonly exact?: boolean;
  readonly disabled?: boolean;
}
