import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { GetSaleTicketUseCase } from './get-sale-ticket.usecase';

describe('GetSaleTicketUseCase', () => {
  let useCase: GetSaleTicketUseCase;
  let repository: { getSaleTicket: jest.Mock };

  const ticket = new SaleTicket({
    folio: 33,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedor1',
    metodoPago: 'EFECTIVO',
    sucursal: 'Sucursal 1',
    productos: [],
    total: '232.00',
  });

  beforeEach(() => {
    repository = { getSaleTicket: jest.fn() };

    TestBed.configureTestingModule({
      providers: [GetSaleTicketUseCase, { provide: SaleRepository, useValue: repository }],
    });

    useCase = TestBed.inject(GetSaleTicketUseCase);
  });

  // Camino feliz: pide el ticket de la venta por id y lo devuelve.
  it('devuelve el ticket de la venta pedida', async () => {
    repository.getSaleTicket.mockReturnValue(of(ticket));

    await expect(firstValueFrom(useCase.execute(33))).resolves.toBe(ticket);
    expect(repository.getSaleTicket).toHaveBeenCalledWith(33);
  });

  // Error del repositorio: se propaga sin transformar.
  it('propaga el error del repositorio', async () => {
    const error = new Error('ticket no disponible');
    repository.getSaleTicket.mockReturnValue(throwError(() => error));

    await expect(firstValueFrom(useCase.execute(33))).rejects.toBe(error);
  });
});
