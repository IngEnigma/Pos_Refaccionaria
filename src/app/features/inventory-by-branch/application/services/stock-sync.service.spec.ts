import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { finalize, of, Subject, throwError } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InventoryByBranchFacade } from '../facades/inventory-by-branch.facade';
import { GetStockUseCase } from '../usecase/get-stock.usecase';
import { StockSyncService } from './stock-sync.service';

describe('StockSyncService', () => {
  let service: StockSyncService;
  let auth: { sucursalId: jest.Mock };
  let getStock: { execute: jest.Mock };
  let inventory: { applyStockSnapshot: jest.Mock };
  let hidden = false;

  const stock = new Map([[7, 3]]);

  beforeEach(() => {
    hidden = false;
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });

    auth = { sucursalId: jest.fn().mockReturnValue(3) };
    getStock = { execute: jest.fn().mockReturnValue(of(stock)) };
    inventory = { applyStockSnapshot: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        StockSyncService,
        { provide: AuthFacade, useValue: auth },
        { provide: GetStockUseCase, useValue: getStock },
        { provide: InventoryByBranchFacade, useValue: inventory },
      ],
    });

    service = TestBed.inject(StockSyncService);
  });

  afterEach(() => service.stop());

  // Consulta al arrancar y luego cada 5 s con la sucursal actual.
  it('consulta de inmediato y cada 5 segundos', fakeAsync(() => {
    service.start();

    expect(getStock.execute).toHaveBeenCalledTimes(1);
    expect(getStock.execute).toHaveBeenCalledWith(3);
    expect(inventory.applyStockSnapshot).toHaveBeenCalledWith(stock);

    tick(5_000);
    expect(getStock.execute).toHaveBeenCalledTimes(2);

    service.stop();
  }));

  // Si una petición sigue en curso, los ticks siguientes se ignoran.
  it('no solapa peticiones mientras una sigue en curso', fakeAsync(() => {
    const pending = new Subject<ReadonlyMap<number, number>>();
    getStock.execute.mockReturnValue(pending);

    service.start();
    tick(5_000);
    expect(getStock.execute).toHaveBeenCalledTimes(1);

    pending.next(stock);
    pending.complete();
    tick(5_000);

    expect(getStock.execute).toHaveBeenCalledTimes(2);

    service.stop();
  }));

  // Una petición colgada se cancela a los 10 s y el polling continúa.
  it('cancela peticiones colgadas y sigue consultando', fakeAsync(() => {
    const hung = new Subject<ReadonlyMap<number, number>>();
    const finalized = jest.fn();
    getStock.execute.mockReturnValue(hung.pipe(finalize(finalized)));

    service.start();
    expect(getStock.execute).toHaveBeenCalledTimes(1);

    tick(10_000);
    expect(finalized).toHaveBeenCalled();

    tick(5_000);
    expect(getStock.execute.mock.calls.length).toBeGreaterThan(1);

    service.stop();
  }));

  // Al cambiar de sucursal consulta de inmediato y descarta la respuesta anterior.
  it('consulta de inmediato al cambiar de sucursal y descarta la anterior', fakeAsync(() => {
    const oldResponse = new Subject<ReadonlyMap<number, number>>();
    const newStock = new Map([[8, 5]]);
    getStock.execute.mockReturnValueOnce(oldResponse).mockReturnValueOnce(of(newStock));

    service.start();
    expect(getStock.execute).toHaveBeenCalledTimes(1);
    expect(getStock.execute).toHaveBeenLastCalledWith(3);

    auth.sucursalId.mockReturnValue(4);
    service.start();

    expect(getStock.execute).toHaveBeenCalledTimes(2);
    expect(getStock.execute).toHaveBeenLastCalledWith(4);
    expect(inventory.applyStockSnapshot).toHaveBeenCalledWith(newStock);

    oldResponse.next(stock);
    oldResponse.complete();

    expect(inventory.applyStockSnapshot).not.toHaveBeenCalledWith(stock);

    service.stop();
  }));

  // Oculta la app: pausa; al volver a visible consulta de inmediato y reanuda el intervalo.
  it('pausa oculto y consulta al volver a visible', fakeAsync(() => {
    service.start();
    expect(getStock.execute).toHaveBeenCalledTimes(1);

    hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    tick(10_000);
    expect(getStock.execute).toHaveBeenCalledTimes(1);

    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(getStock.execute).toHaveBeenCalledTimes(2);

    tick(5_000);
    expect(getStock.execute).toHaveBeenCalledTimes(3);

    service.stop();
  }));

  // Sin sucursal asignada no se consulta.
  it('no consulta sin sucursal', fakeAsync(() => {
    auth.sucursalId.mockReturnValue(null);

    service.start();
    tick(10_000);

    expect(getStock.execute).not.toHaveBeenCalled();

    service.stop();
  }));

  // Un error temporal no detiene el polling.
  it('sigue consultando después de un error', fakeAsync(() => {
    getStock.execute.mockReturnValue(throwError(() => new Error('fallo')));

    service.start();
    expect(getStock.execute).toHaveBeenCalledTimes(1);

    tick(5_000);
    expect(getStock.execute).toHaveBeenCalledTimes(2);

    service.stop();
  }));

  // Una respuesta de una sucursal anterior se descarta.
  it('descarta respuestas de una sucursal anterior', fakeAsync(() => {
    const response$ = new Subject<ReadonlyMap<number, number>>();
    getStock.execute.mockReturnValue(response$);

    service.start();
    auth.sucursalId.mockReturnValue(4);
    response$.next(stock);
    response$.complete();

    expect(inventory.applyStockSnapshot).not.toHaveBeenCalled();

    service.stop();
  }));

  // stop cancela el intervalo y deja de consultar.
  it('stop detiene las consultas', fakeAsync(() => {
    service.start();
    expect(getStock.execute).toHaveBeenCalledTimes(1);

    service.stop();
    tick(10_000);

    expect(getStock.execute).toHaveBeenCalledTimes(1);
  }));
});
