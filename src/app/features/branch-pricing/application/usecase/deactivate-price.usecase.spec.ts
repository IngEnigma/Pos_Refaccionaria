import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BranchPriceRepository } from '@features/branch-pricing/domain/repository/branch-price-repository';
import { DeactivatePriceUseCase } from './deactivate-price.usecase';

describe('DeactivatePriceUseCase', () => {
  let useCase: DeactivatePriceUseCase;
  let repository: jest.Mocked<Pick<BranchPriceRepository, 'deactivatePrice'>>;

  beforeEach(() => {
    repository = { deactivatePrice: jest.fn() };
    TestBed.configureTestingModule({
      providers: [DeactivatePriceUseCase, { provide: BranchPriceRepository, useValue: repository }],
    });
    useCase = TestBed.inject(DeactivatePriceUseCase);
  });

  it('desactiva el precio por id y completa', (done) => {
    repository.deactivatePrice.mockReturnValue(of(undefined));

    useCase.execute(9).subscribe({
      complete: () => {
        expect(repository.deactivatePrice).toHaveBeenCalledWith(9);
        expect(repository.deactivatePrice).toHaveBeenCalledTimes(1);
        done();
      },
    });
  });

  it('propaga el error del repositorio', (done) => {
    const error = new Error('404');
    repository.deactivatePrice.mockReturnValue(throwError(() => error));

    useCase.execute(999).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});
