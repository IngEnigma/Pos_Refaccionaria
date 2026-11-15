import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import { BranchPriceRepository } from '@features/branch-pricing/domain/repository/branch-price-repository';
import { GetActivePriceUseCase } from './get-active-price.usecase';

describe('GetActivePriceUseCase', () => {
  let useCase: GetActivePriceUseCase;
  let repository: jest.Mocked<Pick<BranchPriceRepository, 'getActivePrice'>>;

  const price: BranchPrice = {
    id: 11,
    idProducto: 5,
    idSucursal: 2,
    precioVenta: 12.5,
    vigenteDesde: '2026-03-01T10:00:00-06:00',
    activo: true,
  };

  beforeEach(() => {
    repository = { getActivePrice: jest.fn() };
    TestBed.configureTestingModule({
      providers: [GetActivePriceUseCase, { provide: BranchPriceRepository, useValue: repository }],
    });
    useCase = TestBed.inject(GetActivePriceUseCase);
  });

  it('consulta el precio activo por producto y sucursal y lo devuelve', (done) => {
    repository.getActivePrice.mockReturnValue(of(price));

    useCase.execute(5, 2).subscribe((result) => {
      expect(result).toEqual(price);
      expect(repository.getActivePrice).toHaveBeenCalledWith(5, 2);
      done();
    });
  });

  it('devuelve null si el repositorio no encuentra precio activo', (done) => {
    repository.getActivePrice.mockReturnValue(of(null));

    useCase.execute(5, 2).subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('propaga el error del repositorio', (done) => {
    const error = new Error('404');
    repository.getActivePrice.mockReturnValue(throwError(() => error));

    useCase.execute(5, 2).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});
