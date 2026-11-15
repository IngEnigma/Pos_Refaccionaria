import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PriceHistoryItem } from '@features/branch-pricing/domain/entities/price-history-item.entity';
import { BranchPriceRepository } from '@features/branch-pricing/domain/repository/branch-price-repository';
import { GetPriceHistoryUseCase } from './get-price-history.usecase';

describe('GetPriceHistoryUseCase', () => {
  let useCase: GetPriceHistoryUseCase;
  let repository: jest.Mocked<Pick<BranchPriceRepository, 'getPriceHistory'>>;

  const history: PriceHistoryItem[] = [
    { id: 2, idProducto: 5, idSucursal: 2, precioVenta: 12.5, vigenteDesde: '2026-03-01T10:00:00-06:00', activo: true },
    { id: 1, idProducto: 5, idSucursal: 2, precioVenta: 10, vigenteDesde: '2026-01-01T10:00:00-06:00', activo: false },
  ];

  beforeEach(() => {
    repository = { getPriceHistory: jest.fn() };
    TestBed.configureTestingModule({
      providers: [GetPriceHistoryUseCase, { provide: BranchPriceRepository, useValue: repository }],
    });
    useCase = TestBed.inject(GetPriceHistoryUseCase);
  });

  it('consulta el historial por producto y sucursal y lo devuelve sin reordenar', (done) => {
    repository.getPriceHistory.mockReturnValue(of(history));

    useCase.execute(5, 2).subscribe((result) => {
      expect(result).toEqual(history);
      expect(repository.getPriceHistory).toHaveBeenCalledWith(5, 2);
      done();
    });
  });

  it('devuelve lista vacía si no hay historial', (done) => {
    repository.getPriceHistory.mockReturnValue(of([]));

    useCase.execute(5, 2).subscribe((result) => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('propaga el error del repositorio', (done) => {
    const error = new Error('500');
    repository.getPriceHistory.mockReturnValue(throwError(() => error));

    useCase.execute(5, 2).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});
