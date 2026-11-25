import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

import { Client } from '@features/clients/domain/entities/client.entity';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';
import { ButtonComponent } from '@shared/ui/components/button/button.component';
import { Debt } from '../domain/debt';

const STYLES = `
  .dlg { background: #fff; border-radius: 1rem; padding: 1.5rem; width: min(420px, 92vw); display: grid; gap: 1rem; }
  h2 { margin: 0; font-size: 1.25rem; color: var(--ds-text-strong); }
  label { display: grid; gap: .25rem; font-size: .8rem; font-weight: 600; color: var(--ds-text-muted); }
  input, select { padding: .6rem .75rem; border: 1px solid var(--ds-border-base); border-radius: .5rem; font-size: .9rem; }
  .row { display: flex; justify-content: flex-end; gap: .5rem; }
`;

export interface DebtDialogResult { amount: number; paymentMethodId: number | null }
export interface PaymentDialogData { debt: Debt; methods: PaymentMethod[] }

/** Abono: monto <= saldo (el back lo valida también). */
@Component({
  selector: 'app-debt-payment-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: STYLES,
  template: `
    <form class="dlg" [formGroup]="form" (ngSubmit)="submit()">
      <h2>Registrar abono</h2>
      <p>Saldo pendiente: <strong>{{ data.debt.balance | currency }}</strong></p>
      <label>Monto
        <input type="number" step="0.01" formControlName="amount" aria-label="Monto del abono" />
      </label>
      <label>Método de pago
        <select formControlName="paymentMethodId" aria-label="Método de pago">
          <option [ngValue]="null">—</option>
          @for (m of data.methods; track m.id) { <option [ngValue]="m.id">{{ m.tipo }}</option> }
        </select>
      </label>
      <div class="row">
        <app-button variant="secondary" (click)="ref.close(null)">Cancelar</app-button>
        <app-button type="submit" [disabled]="form.invalid">Abonar</app-button>
      </div>
    </form>`,
})
export class DebtPaymentDialogComponent {
  readonly data = inject<PaymentDialogData>(DIALOG_DATA);
  readonly ref = inject<DialogRef<DebtDialogResult | null>>(DialogRef);
  readonly form = inject(FormBuilder).group({
    amount: [this.data.debt.balance, [Validators.required, Validators.min(0.01), Validators.max(this.data.debt.balance)]],
    paymentMethodId: [null as number | null],
  });

  submit(): void {
    if (this.form.valid) {
      const v = this.form.getRawValue();
      this.ref.close({ amount: Number(v.amount), paymentMethodId: v.paymentMethodId });
    }
  }
}

export interface NewDebtResult { clientId: number; concept: string; total: number }

@Component({
  selector: 'app-new-debt-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: STYLES,
  template: `
    <form class="dlg" [formGroup]="form" (ngSubmit)="submit()">
      <h2>Nuevo adeudo</h2>
      <label>Cliente
        <select formControlName="clientId" aria-label="Cliente">
          <option [ngValue]="null">Selecciona…</option>
          @for (c of clients; track c.id) { <option [ngValue]="c.id">{{ c.nombre }} {{ c.apellidoPaterno }}</option> }
        </select>
      </label>
      <label>Concepto
        <input type="text" formControlName="concept" maxlength="250" aria-label="Concepto" />
      </label>
      <label>Monto
        <input type="number" step="0.01" formControlName="total" aria-label="Monto del adeudo" />
      </label>
      <div class="row">
        <app-button variant="secondary" (click)="ref.close(null)">Cancelar</app-button>
        <app-button type="submit" [disabled]="form.invalid">Registrar</app-button>
      </div>
    </form>`,
})
export class NewDebtDialogComponent {
  readonly clients = inject<Client[]>(DIALOG_DATA);
  readonly ref = inject<DialogRef<NewDebtResult | null>>(DialogRef);
  readonly form = inject(FormBuilder).group({
    clientId: [null as number | null, Validators.required],
    concept: [''],
    total: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  submit(): void {
    if (this.form.valid) {
      const v = this.form.getRawValue();
      this.ref.close({ clientId: v.clientId!, concept: v.concept ?? '', total: Number(v.total) });
    }
  }
}
