import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { CreateCompleteSaleUseCase } from './create-complete-sale.usecase';

// Unit con repositorio doble: verifica interacciones y ramas (venta atómica, ticket null).
// El flujo HTTP real extremo a extremo vive en create-complete-sale.integration.spec.ts.
describe('CreateCompleteSaleUseCase', () => {
  let useCase: CreateCompleteSaleUseCase;
  let saleRepo: { createSale: jest.Mock; deleteSale: jest.Mock; getSaleTicket: jest.Mock };
  let logger: jest.Mocked<LoggerPort>;

  const sale = SaleFactory.fromPrimitives({
    id: 50,
    idUsuario: 1,
    idInventario: 5,
    idMetodoPago: 1,
    total: 200,
    fecha: '2024-01-01',
  });
  const ticket = new SaleTicket({
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedor1',
    metodoPago: 'EFECTIVO',
    sucursal: 'Sucursal 1',
    productos: [],
    total: '232.00',
  });

  beforeEach(() => {
    saleRepo = { createSale: jest.fn(), deleteSale: jest.fn(), getSaleTicket: jest.fn() };
    logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<LoggerPort>;

    TestBed.configureTestingModule({
      providers: [
        CreateCompleteSaleUseCase,
        { provide: SaleRepository, useValue: saleRepo },
        { provide: LOGGER_PORT, useValue: logger },
      ],
    });

    useCase = TestBed.inject(CreateCompleteSaleUseCase);
  });

  // Camino feliz: crea venta, un detalle por producto con el id de la venta y luego pide el ticket.
  it('crea la venta con todos sus productos en una sola llamada y devuelve venta con ticket', async () => {
    saleRepo.createSale.mockReturnValue(of(sale));
    saleRepo.getSaleTicket.mockReturnValue(of(ticket));

    const result = await firstValueFrom(
      useCase.execute({
        idMetodoPago: 1,
        idCliente: 25,
        productos: [
          { id: 10, cantidad: 1 },
          { id: 20, cantidad: 3 },
        ],
      }),
    );

    expect(result).toEqual({ sale, ticket });
    expect(saleRepo.createSale).toHaveBeenCalledTimes(1);
    expect(saleRepo.createSale).toHaveBeenCalledWith({
      idMetodoPago: 1,
      idCliente: 25,
      productos: [
        { id: 10, cantidad: 1 },
        { id: 20, cantidad: 3 },
      ],
    });
    expect(saleRepo.getSaleTicket).toHaveBeenCalledWith(50);
    expect(saleRepo.deleteSale).not.toHaveBeenCalled();
  });

  // Validación: carrito vacío emite error por el observable y no toca ningún repositorio.
  it('emite error si no hay productos y no llama a ningún repositorio', async () => {
    await expect(firstValueFrom(useCase.execute({ idMetodoPago: 1, productos: [] }))).rejects.toThrow(
      'CreateCompleteSale: at least one product is required',
    );

    expect(saleRepo.createSale).not.toHaveBeenCalled();
  });

  // H-29: una cantidad inválida viaja por el observable (no se lanza síncrona) y no crea la venta.
  it.each([[0], [-2], [NaN]])(
    'emite error por el observable si algún producto tiene cantidad %p y no crea la venta',
    async (cantidad) => {
      const result$ = useCase.execute({
        idMetodoPago: 1,
        productos: [
          { id: 10, cantidad: 1 },
          { id: 20, cantidad },
        ],
      });

      await expect(firstValueFrom(result$)).rejects.toThrow(
        'CreateCompleteSale.productos.cantidad: quantity must be greater than zero',
      );
      expect(saleRepo.createSale).not.toHaveBeenCalled();
    },
  );

  // Fallo al crear la venta: no hay venta que revertir ni detalles/ticket que pedir.
  it('propaga el error de createSale (400/403 del backend) sin rollback ni ticket', async () => {
    const error = new Error('stock insuficiente');
    saleRepo.createSale.mockReturnValue(throwError(() => error));

    await expect(
      firstValueFrom(useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 1 }] })),
    ).rejects.toBe(error);

    expect(saleRepo.deleteSale).not.toHaveBeenCalled();
    expect(saleRepo.getSaleTicket).not.toHaveBeenCalled();
  });

  // H-08: la venta ya existe; si el ticket falla se devuelve ticket null, sin rollback ni error.
  it('H-08: si getSaleTicket falla devuelve la venta con ticket null y no hace rollback', async () => {
    const error = new Error('ticket 404');
    saleRepo.createSale.mockReturnValue(of(sale));
    saleRepo.getSaleTicket.mockReturnValue(throwError(() => error));

    const result = await firstValueFrom(
      useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 1 }] }),
    );

    expect(result).toEqual({ sale, ticket: null });
    expect(saleRepo.deleteSale).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Venta creada pero el ticket falló', { saleId: 50, error });
  });
});
