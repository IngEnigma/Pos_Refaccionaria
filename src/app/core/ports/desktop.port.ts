import { InjectionToken } from '@angular/core';

export interface DesktopPrintResult {
  success: boolean;
  message?: string;
}

/** Puente al proceso principal de Electron (preload). */
export interface DesktopPort {
  generateTicket(ticket: unknown): Promise<DesktopPrintResult>;
}

/** `null` fuera de Electron (modo web). */
export const DESKTOP_PORT = new InjectionToken<DesktopPort | null>('DESKTOP_PORT', {
  providedIn: 'root',
  factory: () => (window as unknown as { desktop?: DesktopPort }).desktop ?? null,
});
