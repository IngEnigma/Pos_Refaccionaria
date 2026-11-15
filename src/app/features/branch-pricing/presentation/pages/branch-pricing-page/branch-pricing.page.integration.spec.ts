import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Dialog } from '@angular/cdk/dialog';
import { Building, DollarSign, LucideAngularModule, OctagonX, Package } from 'lucide-angular';
import { of } from 'rxjs';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { BranchRepositoryImpl } from '@features/branches/infrastructure/repositories/branch-repository.impl';
import { BranchPriceRepository } from '../../../domain/repository/branch-price-repository';
import { BranchPriceRepositoryImpl } from '../../../infrastructure/repositories/branch-price-repository.impl';
import { BranchPricingFacade } from '../../../application/facades/branch-pricing.facade';
import { DeactivatePriceUseCase } from '../../../application/usecase/deactivate-price.usecase';
import { BranchPricingPageComponent } from './branch-pricing.page';

/**
 * INT-08: página de precios -> BranchPricingFacade -> use cases -> BranchPriceRepositoryImpl -> HttpClient
 * (con trailingSlashInterceptor). La tabla de productos usa un ProductRepository doble (su HTTP es de `inventory`).
 * Contrato backend (inventario/precio_sucursal_*): POST /precios-sucursal/ crea el precio ACTIVO y desactiva el
 * anterior del mismo par producto-sucursal; /historial/ devuelve todos (más reciente primero); /activo/ el vigente;
 * DELETE /precios-sucursal/<id>/ BORRA la fila (no la desactiva).
 */
describe('INT-08 Precios por sucursal (página + facade + repositorio + http)', () => {
  const API = environment.apiUrl;
  const PRECIOS = `${API}/precios-sucursal/`;
  const SUCURSALES = `${API}/sucursales/`;
  let fixture: ComponentFixture<BranchPricingPageComponent>;
  let page: BranchPricingPageComponent;
  let facade: BranchPricingFacade;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let dialogOpen: jest.SpyInstance;
  let getProducts: jest.Mock;

  const producto = (precioSucursal: number | null) => ({
    id: 7,
    nombre: 'Filtro de aceite',
    clave: 'FA-7',
    marca: 'ACME',
    precioVenta: 100,
    precioSucursal,
  });
  const precioDto = (id: number, precio: string, activo: boolean, desde: string) => ({
    id,
    id_producto: 7,
    id_sucursal: 1,
    precio_venta: precio,
    vigente_desde: desde,
    activo,
  });
  const lastError = () => toasts.toasts().filter((t) => t.type === 'error').at(-1)?.message;

  beforeEach(() => {
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');
    getProducts = jest.fn(() => of({ data: [producto(null)], total: 1, page: 1, pageSize: 200 }));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([trailingSlashInterceptor])),
        provideHttpClientTesting(),
        importProvidersFrom(LucideAngularModule.pick({ Building, DollarSign, OctagonX, Package })),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: BranchRepository, useClass: BranchRepositoryImpl },
        { provide: BranchPriceRepository, useClass: BranchPriceRepositoryImpl },
        { provide: ProductRepository, useValue: { getProducts } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    facade = TestBed.inject(BranchPricingFacade);
    fixture = TestBed.createComponent(BranchPricingPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit -> carga sucursales
    httpMock.expectOne(SUCURSALES).flush([
      { id: 1, nombre_sucursal: 'Centro', ubicacion: 'Calle 1' },
      { id: 2, nombre_sucursal: 'Norte', ubicacion: 'Calle 2' },
    ]);
    page.onBranchChange(1);
    fixture.detectChanges();
    TestBed.flushEffects(); // la tabla carga los productos de la sucursal 1
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    dialogOpen.mockRestore();
  });

  const closeWith = (result: unknown) => dialogOpen.mockReturnValue({ closed: of(result) } as never);

  it('al elegir sucursal la tabla pide los productos de esa sucursal', () => {
    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 200 }, { sucursalId: 1 });
    expect(fixture.nativeElement.textContent).toContain('Filtro de aceite');
  });

  describe('fijar precio -> historial -> precio activo', () => {
    it('POST con el contrato del backend, avisa y recarga la tabla con el precio nuevo', () => {
      closeWith({ idProducto: 7, idSucursal: 1, precioVenta: 85.5 });
      getProducts.mockReturnValue(of({ data: [producto(85.5)], total: 1, page: 1, pageSize: 200 }));

      page.onSetPrice({ productId: 7, sucursalId: 1 });

      const post = httpMock.expectOne(PRECIOS);
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toEqual({ id_producto: 7, id_sucursal: 1, precio_venta: 85.5 });
      post.flush(precioDto(11, '85.50', true, '2026-11-13T10:00:00Z'));
      fixture.detectChanges();

      expect(toasts.toasts().some((t) => t.type === 'success' && /actualizado/.test(t.message))).toBe(true);
      expect(getProducts).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.textContent).toContain('$85.50');
      expect(fixture.nativeElement.textContent).toContain('Activo');
    });

    it('el precio nuevo aparece primero en el historial, es el activo y el anterior queda inactivo', () => {
      closeWith({ idProducto: 7, idSucursal: 1, precioVenta: 85.5 });
      page.onSetPrice({ productId: 7, sucursalId: 1 });
      httpMock.expectOne(PRECIOS).flush(precioDto(11, '85.50', true, '2026-11-13T10:00:00Z'));

      facade.loadPriceHistory(7, 1);
      const hist = httpMock.expectOne((r) => r.url === `${PRECIOS}historial/`);
      expect(hist.request.params.get('id_producto')).toBe('7');
      expect(hist.request.params.get('id_sucursal')).toBe('1');
      hist.flush([
        precioDto(11, '85.50', true, '2026-11-13T10:00:00Z'),
        precioDto(4, '95.00', false, '2026-10-01T10:00:00Z'),
      ]);

      expect(facade.priceHistory().map((h) => [h.precioVenta, h.activo])).toEqual([
        [85.5, true],
        [95, false],
      ]);
      expect(facade.priceHistory().filter((h) => h.activo)).toHaveLength(1);

      facade.loadActivePrice(7, 1);
      httpMock
        .expectOne((r) => r.url === `${PRECIOS}activo/`)
        .flush(precioDto(11, '85.50', true, '2026-11-13T10:00:00Z'));
      expect(facade.prices()).toEqual([
        expect.objectContaining({ id: 11, idProducto: 7, idSucursal: 1, precioVenta: 85.5, activo: true }),
      ]);
      // El precio activo coincide con el primero del historial.
      expect(facade.prices()[0].precioVenta).toBe(facade.priceHistory()[0].precioVenta);
    });

    it('sin precio activo (404) la facade conserva la lista y expone el mensaje del backend', () => {
      facade.loadActivePrice(7, 1);
      httpMock
        .expectOne((r) => r.url === `${PRECIOS}activo/`)
        .flush({ error: 'Precio no encontrado' }, { status: 404, statusText: 'Not Found' });

      expect(facade.prices()).toEqual([]);
      expect(facade.errorMessage()).toBe('Precio no encontrado');
      expect(facade.loading()).toBe(false);
    });
  });

  describe('errores del backend', () => {
    it('precio inválido (400): avisa con un toast de error y NO recarga la tabla', () => {
      closeWith({ idProducto: 7, idSucursal: 1, precioVenta: 5 });

      page.onSetPrice({ productId: 7, sucursalId: 1 });
      httpMock
        .expectOne(PRECIOS)
        .flush({ error: 'precio_venta debe ser mayor a 0' }, { status: 400, statusText: 'Bad Request' });

      expect(lastError()).toBe('precio_venta debe ser mayor a 0'); // H-45
      expect(getProducts).toHaveBeenCalledTimes(1);
      expect(facade.errorMessage()).toBe('precio_venta debe ser mayor a 0');
    });

    it('sin permiso (403): avisa con un toast de error', () => {
      closeWith({ idProducto: 7, idSucursal: 1, precioVenta: 50 });

      page.onSetPrice({ productId: 7, sucursalId: 1 });
      httpMock
        .expectOne(PRECIOS)
        .flush({ detail: "Requiere permiso 'precios.escribir' (rol insuficiente)" }, { status: 403, statusText: 'Forbidden' });

      expect(lastError()).toBeTruthy();
      expect(getProducts).toHaveBeenCalledTimes(1);
    });

    it('cancelar el diálogo no envía nada', () => {
      closeWith(null);

      page.onSetPrice({ productId: 7, sucursalId: 1 });

      httpMock.expectNone(PRECIOS);
    });
  });

  describe('desactivar', () => {
    it('deactivatePrice llama PUT {activo:false} a /precios-sucursal/<id>/ (conserva el historial, H-44)', () => {
      TestBed.inject(DeactivatePriceUseCase).execute(11).subscribe();

      const req = httpMock.expectOne(`${PRECIOS}11/`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ activo: false });
      req.flush({});
    });


    it('onDeactivate confirma, busca el precio activo, lo desactiva con PUT, avisa y recarga (H-37)', () => {
      closeWith(true);
      page.onDeactivate({ productId: 7, sucursalId: 1 });

      httpMock.expectOne((r) => r.url === `${PRECIOS}activo/`).flush(precioDto(11, '85.50', true, '2026-11-13T10:00:00Z'));
      const put = httpMock.expectOne(`${PRECIOS}11/`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toEqual({ activo: false });
      put.flush({});

      expect(toasts.toasts().some((t) => t.type === 'success' && /desactivado/.test(t.message))).toBe(true);
      expect(getProducts).toHaveBeenCalledTimes(2);
    });

    it('onDeactivate cancelado no envía nada', () => {
      closeWith(false);
      page.onDeactivate({ productId: 7, sucursalId: 1 });
      httpMock.expectNone(`${PRECIOS}activo/`);
    });
  });
});
