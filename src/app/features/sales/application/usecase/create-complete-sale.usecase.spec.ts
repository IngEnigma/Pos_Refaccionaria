import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import { LOGGER_PORT, LoggerPort } from '@core/logging/logger.port';
import { SaleRepository } from '@features/sales/domain/repository/sale-repository';
import { SaleDetailRepository } from '@features/sales/domain/repository/sale-detail-repository';
import { SaleFactory } from '@features/sales/domain/entities/sale.entity';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';
import { CreateCompleteSaleUseCase } from './create-complete-sale.usecase';

// Unit con repositorios dobles: verifica interacciones y ramas (rollback, ticket null, huérfana).
// El flujo HTTP real extremo a extremo vive en create-complete-sale.integration.spec.ts.
describe('CreateCompleteSaleUseCase', () => {
  let useCase: CreateCompleteSaleUseCase;
  let saleRepo: { createSale: jest.Mock; deleteSale: jest.Mock; getSaleTicket: jest.Mock };
  let detailRepo: { createSaleDetail: jest.Mock };
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
  const detail = (id: number, productId: number, cantidad: number): SaleDetail => ({
    id,
    productId,
    saleId: 50,
    subtotal: 100,
    cantidad,
  });

  beforeEach(() => {
    saleRepo = { createSale: jest.fn(), deleteSale: jest.fn(), getSaleTicket: jest.fn() };
    detailRepo = { createSaleDetail: jest.fn() };
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
        { provide: SaleDetailRepository, useValue: detailRepo },
        { provide: LOGGER_PORT, useValue: logger },
      ],
    });

    useCase = TestBed.inject(CreateCompleteSaleUseCase);
  });

  // Camino feliz: crea venta, un detalle por producto con el id de la venta y luego pide el ticket.
  it('crea la venta, un detalle por producto y devuelve venta con ticket', async () => {
    saleRepo.createSale.mockReturnValue(of(sale));
    detailRepo.createSaleDetail.mockImplementation(({ productId, cantidad }) =>
      of(detail(productId, productId, cantidad)),
    );
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
    expect(saleRepo.createSale).toHaveBeenCalledWith({ idMetodoPago: 1, idCliente: 25 });
    expect(detailRepo.createSaleDetail).toHaveBeenCalledTimes(2);
    expect(detailRepo.createSaleDetail).toHaveBeenCalledWith({ productId: 10, saleId: 50, cantidad: 1 });
    expect(detailRepo.createSaleDetail).toHaveBeenCalledWith({ productId: 20, saleId: 50, cantidad: 3 });
    expect(saleRepo.getSaleTicket).toHaveBeenCalledWith(50);
    expect(saleRepo.deleteSale).not.toHaveBeenCalled();
  });

  // Validación: carrito vacío emite error por el observable y no toca ningún repositorio.
  it('emite error si no hay productos y no llama a ningún repositorio', async () => {
    await expect(firstValueFrom(useCase.execute({ idMetodoPago: 1, productos: [] }))).rejects.toThrow(
      'CreateCompleteSale: at least one product is required',
    );

    expect(saleRepo.createSale).not.toHaveBeenCalled();
    expect(detailRepo.createSaleDetail).not.toHaveBeenCalled();
  });

  // Validación: una cantidad inválida lanza síncrono antes de crear la venta.
  it.each([[0], [-2], [NaN]])(
    'lanza error síncrono si algún producto tiene cantidad %p y no crea la venta',
    (cantidad) => {
      expect(() =>
        useCase.execute({
          idMetodoPago: 1,
          productos: [
            { id: 10, cantidad: 1 },
            { id: 20, cantidad },
          ],
        }),
      ).toThrow('CreateCompleteSale.productos.cantidad: quantity must be greater than zero');

      expect(saleRepo.createSale).not.toHaveBeenCalled();
    },
  );

  // Fallo al crear la venta: no hay venta que revertir ni detalles/ticket que pedir.
  it('propaga el error de createSale sin rollback, detalles ni ticket', async () => {
    const error = new Error('stock insuficiente');
    saleRepo.createSale.mockReturnValue(throwError(() => error));

    await expect(
      firstValueFrom(useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 1 }] })),
    ).rejects.toBe(error);

    expect(detailRepo.createSaleDetail).not.toHaveBeenCalled();
    expect(saleRepo.deleteSale).not.toHaveBeenCalled();
    expect(saleRepo.getSaleTicket).not.toHaveBeenCalled();
  });

  // Rollback: si un detalle falla se elimina la venta creada y se propaga el error original.
  it('ante fallo de un detalle elimina la venta y propaga el error original sin pedir ticket', async () => {
    const error = new Error('detalle falló');
    saleRepo.createSale.mockReturnValue(of(sale));
    detailRepo.createSaleDetail.mockImplementation(({ productId }) =>
      productId === 20 ? throwError(() => error) : of(detail(1, productId, 1)),
    );
    saleRepo.deleteSale.mockReturnValue(of(true));

    await expect(
      firstValueFrom(
        useCase.execute({
          idMetodoPago: 1,
          productos: [
            { id: 10, cantidad: 1 },
            { id: 20, cantidad: 1 },
          ],
        }),
      ),
    ).rejects.toBe(error);

    expect(saleRepo.deleteSale).toHaveBeenCalledTimes(1);
    expect(saleRepo.deleteSale).toHaveBeenCalledWith(50);
    expect(saleRepo.getSaleTicket).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Detalle falló, rollback venta', { saleId: 50, error });
  });

  // H-09: si el rollback también falla, el error nombra la venta huérfana y conserva la causa original.
  it('H-09: si el rollback falla emite error con la venta huérfana y el error original como cause', async () => {
    const detailError = new Error('detalle falló');
    const rollbackError = new Error('rollback falló');
    saleRepo.createSale.mockReturnValue(of(sale));
    detailRepo.createSaleDetail.mockReturnValue(throwError(() => detailError));
    saleRepo.deleteSale.mockReturnValue(throwError(() => rollbackError));

    const caught = await firstValueFrom(
      useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 1 }] }),
    ).catch((e: unknown) => e as Error);

    expect(caught).not.toBe(detailError);
    expect(caught.message).toBe(
      'No se pudo registrar la venta #50 ni revertirla. Avisa a un administrador antes de reintentar.',
    );
    expect(caught.cause).toBe(detailError);
    expect(saleRepo.getSaleTicket).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Rollback falló', { saleId: 50, rollbackError });
  });

  // H-08: la venta ya existe; si el ticket falla se devuelve ticket null, sin rollback ni error.
  it('H-08: si getSaleTicket falla devuelve la venta con ticket null y no hace rollback', async () => {
    const error = new Error('ticket 404');
    saleRepo.createSale.mockReturnValue(of(sale));
    detailRepo.createSaleDetail.mockReturnValue(of(detail(1, 10, 1)));
    saleRepo.getSaleTicket.mockReturnValue(throwError(() => error));

    const result = await firstValueFrom(
      useCase.execute({ idMetodoPago: 1, productos: [{ id: 10, cantidad: 1 }] }),
    );

    expect(result).toEqual({ sale, ticket: null });
    expect(saleRepo.deleteSale).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('Venta creada pero el ticket falló', { saleId: 50, error });
  });
});
