import { ShellRole } from './shell-role.model';

export interface SidebarNavItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly exact?: boolean;
  readonly disabled?: boolean;
  readonly roles?: readonly ShellRole[];
}
