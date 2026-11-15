import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BranchPrice } from '@features/branch-pricing/domain/entities/branch-price.entity';
import {
  BranchPriceRepository,
  SetBranchPricePayload,
} from '@features/branch-pricing/domain/repository/branch-price-repository';
import { SetBranchPriceUseCase } from './set-branch-price.usecase';

describe('SetBranchPriceUseCase', () => {
  let useCase: SetBranchPriceUseCase;
  let repository: jest.Mocked<Pick<BranchPriceRepository, 'setBranchPrice'>>;

  const payload: SetBranchPricePayload = { idProducto: 5, idSucursal: 2, precioVenta: 12.5 };
  const price: BranchPrice = {
    id: 11,
    idProducto: 5,
    idSucursal: 2,
    precioVenta: 12.5,
    vigenteDesde: '2026-03-01T10:00:00-06:00',
    activo: true,
  };

  beforeEach(() => {
    repository = { setBranchPrice: jest.fn() };
    TestBed.configureTestingModule({
      providers: [SetBranchPriceUseCase, { provide: BranchPriceRepository, useValue: repository }],
    });
    useCase = TestBed.inject(SetBranchPriceUseCase);
  });

  it('delega el payload tal cual al repositorio y devuelve el precio creado', (done) => {
    repository.setBranchPrice.mockReturnValue(of(price));

    useCase.execute(payload).subscribe((result) => {
      expect(result).toEqual(price);
      expect(repository.setBranchPrice).toHaveBeenCalledWith(payload);
      expect(repository.setBranchPrice).toHaveBeenCalledTimes(1);
      done();
    });
  });

  // H-14: el use case valida el precio antes de llamar al repositorio.
  it.each([0, -5, 10.999, 1.005, 100000000, NaN, 'abc' as unknown as number])(
    'rechaza el precio inválido %p sin llamar al repositorio',
    (precioVenta) => {
      let error: Error | undefined;

      useCase.execute({ ...payload, precioVenta }).subscribe({ error: (e) => (error = e) });

      expect(error?.message).toMatch(/precio/i);
      expect(repository.setBranchPrice).not.toHaveBeenCalled();
    },
  );

  it.each([0.01, 8.75, 99999999.99])('acepta el precio válido %p', (precioVenta) => {
    repository.setBranchPrice.mockReturnValue(of(price));

    useCase.execute({ ...payload, precioVenta }).subscribe();

    expect(repository.setBranchPrice).toHaveBeenCalledWith({ ...payload, precioVenta });
  });

  it('propaga el error del repositorio', (done) => {
    const error = new Error('precio_venta debe ser mayor a 0');
    repository.setBranchPrice.mockReturnValue(throwError(() => error));

    useCase.execute(payload).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});
