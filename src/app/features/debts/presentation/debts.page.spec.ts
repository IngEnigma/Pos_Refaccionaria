import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { LucideAngularModule, Plus } from 'lucide-angular';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { GlobalSearchService } from '@core/search/global-search.service';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { DebtsFacade } from '../application/facades/debts.facade';
import { Debt } from '../domain/debt';
import { DebtsPageComponent } from './debts.page';

describe('DebtsPageComponent', () => {
  const debt = (id: number, balance: number, status: Debt['status']): Debt => ({
    id, clientId: 1, saleId: null, concept: 'x', total: 100, balance, status, date: '2026-11-24T10:00:00Z',
  });
  const errorMessage = signal<string | null>(null);
  const facade = {
    debts: signal([debt(1, 40, 'pendiente'), debt(2, 0, 'pagado')]),
    clients: signal([{ id: 1, nombre: 'Ana', apellidoPaterno: 'Ruiz' }]),
    methods: signal([]),
    loading: signal(false),
    errorMessage,
    loadCatalogs: jest.fn(),
    loadDebts: jest.fn(),
    addPayment: jest.fn(() => of({})),
    createDebt: jest.fn(() => of({})),
    cancelDebt: jest.fn(() => of(undefined)),
  };
  const toast = { success: jest.fn(), error: jest.fn() };
  const role = signal<string>('seller');

  const setup = () => {
    const f = TestBed.createComponent(DebtsPageComponent);
    f.detectChanges();
    return f;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    errorMessage.set(null);
    role.set('seller');
    TestBed.configureTestingModule({
      imports: [DebtsPageComponent, LucideAngularModule.pick({ Plus })],
      providers: [
        { provide: DebtsFacade, useValue: facade },
        { provide: GlobalSearchService, useValue: { search: <T>(l: T[]) => l } },
        { provide: ToastService, useValue: toast },
        { provide: AuthFacade, useValue: { role } },
      ],
    });
  });

  it('carga pendientes, muestra nombre del cliente y suma solo el saldo pendiente', () => {
    const f = setup();
    expect(facade.loadDebts).toHaveBeenCalledWith('pendiente');
    expect(f.componentInstance.rows()[0].clientName).toBe('Ana Ruiz');
    expect(f.componentInstance.pendingBalance()).toBe(40);
  });

  it('"Todos" consulta sin filtro de estado', () => {
    const f = setup();
    f.componentInstance.setStatus('');
    expect(facade.loadDebts).toHaveBeenLastCalledWith(undefined);
  });

  it('abona con el resultado del diálogo y recarga', () => {
    const f = setup();
    jest.spyOn(f.debugElement.injector.get(Dialog), 'open').mockReturnValue({ closed: of({ amount: 10, paymentMethodId: 2 }) } as never);
    f.componentInstance.onPay(debt(1, 40, 'pendiente'));
    expect(facade.addPayment).toHaveBeenCalledWith(1, 10, 2);
    expect(toast.success).toHaveBeenCalledWith('Abono registrado');
    expect(facade.loadDebts).toHaveBeenCalledTimes(2);
  });

  it('muestra como toast el error del facade', () => {
    const f = setup();
    errorMessage.set('El abono no puede exceder el saldo pendiente');
    f.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('El abono no puede exceder el saldo pendiente');
  });

  it('el cajero no ve "Cancelar" (el back responde 403); encargado y admin sí', () => {
    const f = setup();
    const botones = () => (f.nativeElement as HTMLElement).textContent ?? '';
    expect(f.componentInstance.canManage()).toBe(false);
    expect(botones()).not.toContain('Cancelar');
    role.set('manager');
    f.detectChanges();
    expect(f.componentInstance.canManage()).toBe(true);
    expect(botones()).toContain('Cancelar');
  });
});
