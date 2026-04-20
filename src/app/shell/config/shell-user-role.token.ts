import { InjectionToken, Signal } from '@angular/core';
import { ShellRole } from '@shell/models/shell-role.model';

export const SHELL_USER_ROLE = new InjectionToken<Signal<ShellRole | null>>(
  'SHELL_USER_ROLE'
);
