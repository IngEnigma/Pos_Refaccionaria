import { Observable } from 'rxjs';

export type DebtStatus = 'pendiente' | 'pagado' | 'cancelado';

export interface Debt {
  id: number;
  clientId: number;
  saleId: number | null;
  concept: string;
  total: number;
  balance: number;
  status: DebtStatus;
  date: string;
}

export interface DebtPayment {
  id: number;
  amount: number;
  paymentMethodId: number | null;
  date: string;
}

export interface CreateDebtPayload {
  clientId: number;
  concept: string;
  total: number;
}

export abstract class DebtRepository {
  abstract getDebts(status?: DebtStatus): Observable<Debt[]>;
  abstract createDebt(payload: CreateDebtPayload): Observable<Debt>;
  abstract cancelDebt(id: number): Observable<void>;
  abstract getPayments(debtId: number): Observable<DebtPayment[]>;
  abstract addPayment(debtId: number, amount: number, paymentMethodId: number | null): Observable<DebtPayment>;
}
