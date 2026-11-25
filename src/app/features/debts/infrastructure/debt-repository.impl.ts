import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { CreateDebtPayload, Debt, DebtPayment, DebtRepository, DebtStatus } from '../domain/debt';

// El back serializa los Decimal como string.
interface DebtDto {
  id: number;
  id_cliente: number;
  id_venta: number | null;
  concepto: string;
  monto_total: string | number;
  saldo: string | number;
  estado: DebtStatus;
  fecha: string;
}

interface PaymentDto {
  id: number;
  monto: string | number;
  id_metodo_pago: number | null;
  fecha: string;
}

const toDebt = (d: DebtDto): Debt => ({
  id: d.id,
  clientId: d.id_cliente,
  saleId: d.id_venta,
  concept: d.concepto,
  total: Number(d.monto_total),
  balance: Number(d.saldo),
  status: d.estado,
  date: d.fecha,
});

const toPayment = (p: PaymentDto): DebtPayment => ({
  id: p.id,
  amount: Number(p.monto),
  paymentMethodId: p.id_metodo_pago,
  date: p.fecha,
});

@Injectable({ providedIn: 'root' })
export class DebtRepositoryImpl implements DebtRepository {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject<Environment>(APP_ENV).apiUrl}/adeudos`;

  getDebts(status?: DebtStatus): Observable<Debt[]> {
    const params = status ? new HttpParams().set('estado', status) : undefined;
    return this.http.get<DebtDto[]>(this.endpoint, { params }).pipe(map((r) => r.map(toDebt)));
  }

  createDebt(p: CreateDebtPayload): Observable<Debt> {
    return this.http
      .post<DebtDto>(this.endpoint, { id_cliente: p.clientId, concepto: p.concept, monto_total: p.total })
      .pipe(map(toDebt));
  }

  cancelDebt(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }

  getPayments(debtId: number): Observable<DebtPayment[]> {
    return this.http.get<PaymentDto[]>(`${this.endpoint}/${debtId}/abonos`).pipe(map((r) => r.map(toPayment)));
  }

  addPayment(debtId: number, amount: number, paymentMethodId: number | null): Observable<DebtPayment> {
    return this.http
      .post<PaymentDto>(`${this.endpoint}/${debtId}/abonos`, { monto: amount, id_metodo_pago: paymentMethodId })
      .pipe(map(toPayment));
  }
}
