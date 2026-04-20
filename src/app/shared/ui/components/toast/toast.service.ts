import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private readonly timerMap = new Map<string, ReturnType<typeof setTimeout>>();

  private readonly defaults: Record<Toast['type'], string> = {
    success: 'Operación realizada con éxito',
    error: 'Error, por favor intente de nuevo',
    warning: 'Atención: Revise la información',
    info: 'Información del sistema',
  };

  private readonly MAX_TOASTS = 5;

  show(message?: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = crypto.randomUUID();
    const finalMessage = message && message.trim() !== '' ? message : this.defaults[type];
    
    this._toasts.update((t) => {
      const activeToasts = t.length >= this.MAX_TOASTS ? t.slice(1) : t;
      return [...activeToasts, { id, message: finalMessage, type }];
    });
    
    const timer = setTimeout(() => this.dismiss(id), duration);
    this.timerMap.set(id, timer);
  }

  dismiss(id: string): void {
    const timer = this.timerMap.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timerMap.delete(id);
    }
    this._toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  success(msg?: string): void {
    this.show(msg, 'success');
  }

  error(msg?: string): void {
    this.show(msg || this.defaults.error, 'error');
  }

  warning(msg?: string): void {
    this.show(msg, 'warning');
  }

  info(msg?: string): void {
    this.show(msg, 'info');
  }
}
