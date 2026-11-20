import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { SuppliersPageComponent } from './suppliers.page';
import { SuppliersFacade } from '../../../application/facades/suppliers.facade';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { ToastService } from '@shared/ui/components/toast/toast.service';

// H-43: con el ToastService real (sin mock) el effect no debe lanzar NG0600 y el aviso debe quedar registrado.
describe('SuppliersPageComponent — toast real del error (H-43)', () => {
  it('el errorMessage de la facade llega al ToastService', () => {
    const error = signal<string | null>(null);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthFacade, useValue: { role: signal('admin') } }, { provide: SuppliersFacade, useValue: { errorMessage: error.asReadonly(), loadSuppliers: jest.fn() } }],
    });
    TestBed.runInInjectionContext(() => new SuppliersPageComponent());

    error.set('No se pudo cargar proveedores');
    TestBed.flushEffects();

    expect(TestBed.inject(ToastService).toasts().map((t) => [t.type, t.message])).toEqual([
      ['error', 'No se pudo cargar proveedores'],
    ]);
  });
});
