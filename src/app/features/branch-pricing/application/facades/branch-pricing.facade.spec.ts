import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { BranchPrice } from '../../domain/entities/branch-price.entity';
import { PriceHistoryItem } from '../../domain/entities/price-history-item.entity';
import { SetBranchPricePayload } from '../../domain/repository/branch-price-repository';
import { GetActivePriceUseCase } from '../usecase/get-active-price.usecase';
import { GetPriceHistoryUseCase } from '../usecase/get-price-history.usecase';
import { SetBranchPriceUseCase } from '../usecase/set-branch-price.usecase';
import { BranchPricingFacade } from './branch-pricing.facade';

describe('BranchPricingFacade', () => {
  const makePrice = (overrides: Partial<BranchPrice> = {}): BranchPrice => ({
    id: 1,
    idProducto: 5,
    idSucursal: 2,
    precioVenta: 12.5,
    vigenteDesde: '2026-03-01T10:00:00-06:00',
    activo: true,
    ...overrides,
  });
  const makeHistory = (overrides: Partial<PriceHistoryItem> = {}): PriceHistoryItem => ({
    id: 1,
    idProducto: 5,
    idSucursal: 2,
    precioVenta: 10,
    vigenteDesde: '2026-01-01T10:00:00-06:00',
    activo: false,
    ...overrides,
  });
  const payload: SetBranchPricePayload = { idProducto: 5, idSucursal: 2, precioVenta: 12.5 };

  let getActive: jest.Mock;
  let getHistory: jest.Mock;
  let setPrice: jest.Mock;
  let loggerError: jest.Mock;
  let facade: BranchPricingFacade;

  beforeEach(() => {
    getActive = jest.fn();
    getHistory = jest.fn();
    setPrice = jest.fn();
    loggerError = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: GetActivePriceUseCase, useValue: { execute: getActive } },
        { provide: GetPriceHistoryUseCase, useValue: { execute: getHistory } },
        { provide: SetBranchPriceUseCase, useValue: { execute: setPrice } },
        { provide: LoggerService, useValue: { withContext: () => ({ error: loggerError }) } },
      ],
    });
    facade = TestBed.inject(BranchPricingFacade);
  });

  it('inicia sin sucursal, precios ni historial, sin loading y sin error', () => {
    expect(facade.selectedSucursalId()).toBeNull();
    expect(facade.prices()).toEqual([]);
    expect(facade.priceHistory()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.historyLoading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  describe('loadActivePrice', () => {
    it('consulta el use case con producto y sucursal y publica el precio', () => {
      getActive.mockReturnValue(of(makePrice()));

      facade.loadActivePrice(5, 2);

      expect(getActive).toHaveBeenCalledWith(5, 2);
      expect(facade.prices()).toEqual([makePrice()]);
      expect(facade.loading()).toBe(false);
      expect(facade.errorMessage()).toBeNull();
    });

    it('mantiene loading=true mientras la petición está pendiente', () => {
      const pending = new Subject<BranchPrice | null>();
      getActive.mockReturnValue(pending);

      facade.loadActivePrice(5, 2);
      expect(facade.loading()).toBe(true);

      pending.next(makePrice());
      pending.complete();
      expect(facade.loading()).toBe(false);
    });

    it('reemplaza el precio previo del mismo producto y sucursal sin duplicarlo', () => {
      getActive.mockReturnValueOnce(of(makePrice({ id: 1, precioVenta: 10 })));
      getActive.mockReturnValueOnce(of(makePrice({ id: 2, precioVenta: 15.75 })));

      facade.loadActivePrice(5, 2);
      facade.loadActivePrice(5, 2);

      expect(facade.prices()).toEqual([makePrice({ id: 2, precioVenta: 15.75 })]);
    });

    it('conserva los precios de otros productos y sucursales', () => {
      const otroProducto = makePrice({ id: 3, idProducto: 6 });
      const otraSucursal = makePrice({ id: 4, idSucursal: 9 });
      getActive.mockReturnValueOnce(of(otroProducto));
      getActive.mockReturnValueOnce(of(otraSucursal));
      getActive.mockReturnValueOnce(of(makePrice()));

      facade.loadActivePrice(6, 2);
      facade.loadActivePrice(5, 9);
      facade.loadActivePrice(5, 2);

      expect(facade.prices()).toHaveLength(3);
      expect(facade.prices()).toEqual(expect.arrayContaining([otroProducto, otraSucursal, makePrice()]));
    });

    it('no agrega nada si no hay precio activo (null) y no marca error', () => {
      getActive.mockReturnValue(of(null));

      facade.loadActivePrice(5, 2);

      expect(facade.prices()).toEqual([]);
      expect(facade.errorMessage()).toBeNull();
      expect(facade.loading()).toBe(false);
    });

    it('expone el mensaje del backend, registra el error y apaga loading si falla', () => {
      const httpError = new HttpErrorResponse({
        status: 400,
        error: { message: 'Debe enviar id_sucursal' },
      });
      getActive.mockReturnValue(throwError(() => httpError));

      facade.loadActivePrice(5, 2);

      expect(facade.errorMessage()).toBe('Debe enviar id_sucursal');
      expect(facade.prices()).toEqual([]);
      expect(facade.loading()).toBe(false);
      expect(loggerError).toHaveBeenCalledWith('Failed to load active price', {
        message: 'Debe enviar id_sucursal',
      });
    });

    it('limpia el error previo al iniciar una nueva carga', () => {
      getActive.mockReturnValueOnce(throwError(() => new Error('boom')));
      getActive.mockReturnValueOnce(of(makePrice()));

      facade.loadActivePrice(5, 2);
      expect(facade.errorMessage()).toBe('boom');
      facade.loadActivePrice(5, 2);

      expect(facade.errorMessage()).toBeNull();
    });

    it('conserva los precios ya cargados cuando una nueva carga falla', () => {
      getActive.mockReturnValueOnce(of(makePrice()));
      getActive.mockReturnValueOnce(throwError(() => new Error('boom')));

      facade.loadActivePrice(5, 2);
      facade.loadActivePrice(6, 2);

      expect(facade.prices()).toEqual([makePrice()]);
    });
  });

  describe('loadPriceHistory', () => {
    it('publica el historial y apaga historyLoading', () => {
      const history = [makeHistory({ id: 2, precioVenta: 12.5, activo: true }), makeHistory({ id: 1 })];
      getHistory.mockReturnValue(of(history));

      facade.loadPriceHistory(5, 2);

      expect(getHistory).toHaveBeenCalledWith(5, 2);
      expect(facade.priceHistory()).toEqual(history);
      expect(facade.historyLoading()).toBe(false);
      expect(facade.errorMessage()).toBeNull();
    });

    it('mantiene historyLoading=true mientras la petición está pendiente sin tocar loading', () => {
      const pending = new Subject<PriceHistoryItem[]>();
      getHistory.mockReturnValue(pending);

      facade.loadPriceHistory(5, 2);
      expect(facade.historyLoading()).toBe(true);
      expect(facade.loading()).toBe(false);

      pending.next([]);
      pending.complete();
      expect(facade.historyLoading()).toBe(false);
    });

    it('deja el historial vacío, expone el error y lo registra si falla', () => {
      getHistory.mockReturnValueOnce(of([makeHistory()]));
      getHistory.mockReturnValueOnce(throwError(() => new Error('sin conexión')));

      facade.loadPriceHistory(5, 2);
      facade.loadPriceHistory(5, 2);

      expect(facade.priceHistory()).toEqual([]);
      expect(facade.errorMessage()).toBe('sin conexión');
      expect(facade.historyLoading()).toBe(false);
      expect(loggerError).toHaveBeenCalledWith('Failed to load price history', { message: 'sin conexión' });
    });

    it('clearHistory vacía el historial', () => {
      getHistory.mockReturnValue(of([makeHistory()]));
      facade.loadPriceHistory(5, 2);

      facade.clearHistory();

      expect(facade.priceHistory()).toEqual([]);
    });
  });

  describe('setBranchPrice', () => {
    it('delega el payload en el use case y emite el precio creado', (done) => {
      const created = makePrice({ id: 20 });
      setPrice.mockReturnValue(of(created));

      facade.setBranchPrice(payload).subscribe((price) => {
        expect(price).toEqual(created);
        expect(setPrice).toHaveBeenCalledWith(payload);
        done();
      });
    });

    it('marca loading=true y lo apaga al completar', () => {
      const pending = new Subject<BranchPrice>();
      setPrice.mockReturnValue(pending);

      facade.setBranchPrice(payload).subscribe();
      expect(facade.loading()).toBe(true);

      pending.next(makePrice());
      pending.complete();
      expect(facade.loading()).toBe(false);
      expect(facade.errorMessage()).toBeNull();
    });

    it('expone el mensaje del backend (error.error), relanza el error original y apaga loading', () => {
      const httpError = new HttpErrorResponse({
        status: 400,
        error: { error: 'precio_venta debe ser mayor a 0' },
      });
      setPrice.mockReturnValue(throwError(() => httpError));
      let caught: unknown;

      facade.setBranchPrice(payload).subscribe({ error: (err) => (caught = err) });

      expect(caught).toBe(httpError);
      expect(facade.errorMessage()).toBe('precio_venta debe ser mayor a 0');
      expect(facade.loading()).toBe(false);
      expect(loggerError).toHaveBeenCalledWith('Failed to set branch price', {
        message: 'precio_venta debe ser mayor a 0',
        payload,
      });
    });

    it('limpia el error previo al iniciar un nuevo guardado', () => {
      setPrice.mockReturnValueOnce(throwError(() => new Error('boom')));
      setPrice.mockReturnValueOnce(of(makePrice()));
      facade.setBranchPrice(payload).subscribe({ error: () => undefined });
      expect(facade.errorMessage()).toBe('boom');

      facade.setBranchPrice(payload).subscribe();

      expect(facade.errorMessage()).toBeNull();
    });

    it.todo('H-37: la fachada no expone deactivatePrice; DeactivatePriceUseCase existe pero ninguna capa lo usa');
  });

  describe('resolución del mensaje de error', () => {
    const failWith = (error: unknown): string | null => {
      getActive.mockReturnValue(throwError(() => error));
      facade.loadActivePrice(5, 2);
      return facade.errorMessage();
    };

    it('prefiere error.error.message del backend', () => {
      expect(failWith(new HttpErrorResponse({ status: 400, error: { message: 'm', error: 'e' } }))).toBe('m');
    });

    it('usa error.error.error si no hay message', () => {
      expect(failWith(new HttpErrorResponse({ status: 400, error: { error: 'e' } }))).toBe('e');
    });

    it('usa el message de HttpErrorResponse si el cuerpo no trae mensaje', () => {
      const httpError = new HttpErrorResponse({ status: 500, statusText: 'Server Error', url: '/x' });

      expect(failWith(httpError)).toBe(httpError.message);
    });

    it('usa el message de un Error genérico', () => {
      expect(failWith(new Error('falló'))).toBe('falló');
    });

    it('usa el mensaje genérico si el error no es Error ni HttpErrorResponse', () => {
      expect(failWith('texto')).toBe('Ocurrió un error inesperado.');
    });

    it('usa el mensaje genérico si el Error no trae message', () => {
      expect(failWith(new Error(''))).toBe('Ocurrió un error inesperado.');
    });
  });
});
