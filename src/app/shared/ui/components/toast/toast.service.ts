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

  show(message: string, type: Toast['type'] = 'info', duration = 4000): void {
    const id = crypto.randomUUID();
    this._toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this._toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  success(msg: string): void {
    this.show(msg, 'success');
  }

  error(msg: string): void {
    this.show(msg, 'error');
  }

  warning(msg: string): void {
    this.show(msg, 'warning');
  }

  info(msg: string): void {
    this.show(msg, 'info');
  }
}
