import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { Observable } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { GlobalSearchService } from '@core/search/global-search.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { DebtsFacade } from '../application/facades/debts.facade';
import { Debt, DebtStatus } from '../domain/debt';
import {
  DebtDialogResult,
  DebtPaymentDialogComponent,
  NewDebtDialogComponent,
  NewDebtResult,
} from './debt-dialogs.component';

@Component({
  selector: 'app-debts-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DialogModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './debts.page.css',
  templateUrl: './debts.page.html',
})
export class DebtsPageComponent implements OnInit {
  readonly facade = inject(DebtsFacade);
  private readonly authFacade = inject(AuthFacade);
  /** Cancelar exige permiso de escritura en el back: el cajero recibe 403 (igual que en clientes). */
  readonly canManage = computed(() => this.authFacade.role() !== 'seller');
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  private readonly globalSearch = inject(GlobalSearchService);

  readonly statuses: { value: DebtStatus | ''; label: string }[] = [
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'pagado', label: 'Pagados' },
    { value: 'cancelado', label: 'Cancelados' },
    { value: '', label: 'Todos' },
  ];
  readonly status = signal<DebtStatus | ''>('pendiente');
  readonly loading = this.facade.loading;

  /** Fila = adeudo + nombre del cliente, para que el buscador del navbar filtre por cliente. */
  readonly rows = computed(() => {
    const names = new Map(this.facade.clients().map((c) => [c.id, `${c.nombre} ${c.apellidoPaterno}`]));
    return this.globalSearch.search(
      this.facade.debts().map((d) => ({ ...d, clientName: names.get(d.clientId) ?? `#${d.clientId}` })),
    );
  });
  readonly pendingBalance = computed(() =>
    this.rows().reduce((sum, d) => sum + (d.status === 'pendiente' ? d.balance : 0), 0),
  );

  constructor() {
    effect(() => {
      const msg = this.facade.errorMessage();
      if (msg) this.toast.error(msg);
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.facade.loadCatalogs();
    this.load();
  }

  setStatus(value: string): void {
    this.status.set(value as DebtStatus | '');
    this.load();
  }

  load(): void {
    this.facade.loadDebts(this.status() || undefined);
  }

  onNew(): void {
    this.dialog
      .open<NewDebtResult | null>(NewDebtDialogComponent, { data: this.facade.clients() })
      .closed.subscribe((r) => {
        if (r) this.run(this.facade.createDebt(r), 'Adeudo registrado');
      });
  }

  onPay(debt: Debt): void {
    this.dialog
      .open<DebtDialogResult | null>(DebtPaymentDialogComponent, { data: { debt, methods: this.facade.methods() } })
      .closed.subscribe((r) => {
        if (r) this.run(this.facade.addPayment(debt.id, r.amount, r.paymentMethodId), 'Abono registrado');
      });
  }

  onCancel(debt: Debt): void {
    this.dialog
      .open<boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Cancelar adeudo',
          message: `¿Cancelar el adeudo #${debt.id}? Ya no se podrá abonar.`,
          confirmText: 'Cancelar adeudo',
          cancelText: 'Volver',
          variant: 'danger',
        },
      })
      .closed.subscribe((ok) => {
        if (ok) this.run(this.facade.cancelDebt(debt.id), 'Adeudo cancelado');
      });
  }

  private run(op: Observable<unknown>, okMsg: string): void {
    // El error ya lo publica el facade (toast vía effect).
    op.subscribe({ next: () => { this.toast.success(okMsg); this.load(); }, error: () => undefined });
  }
}
