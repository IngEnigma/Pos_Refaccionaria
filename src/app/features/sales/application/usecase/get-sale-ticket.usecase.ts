import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SaleRepository } from '../../domain/repository/sale-repository';
import { SaleTicket } from '../../domain/entities/sale-ticket.entity';

@Injectable({ providedIn: 'root' })
export class GetSaleTicketUseCase {
    private readonly saleRepository = inject(SaleRepository);

    execute(saleId: number): Observable<SaleTicket> {
        return this.saleRepository.getSaleTicket(saleId);
    }
}