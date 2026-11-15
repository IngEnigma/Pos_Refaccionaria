import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Building } from 'lucide-angular';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { BranchesFacade } from '@features/branches/application/facades/branches.facade';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { BranchPrice } from '../../../domain/entities/branch-price.entity';
import { SetBranchPricePayload } from '../../../domain/repository/branch-price-repository';
import { BranchPricingFacade } from '../../../application/facades/branch-pricing.facade';
import { SetBranchPriceUseCase } from '../../../application/usecase/set-branch-price.usecase';
import { DeactivatePriceUseCase } from '../../../application/usecase/deactivate-price.usecase';
import { GetActivePriceUseCase } from '../../../application/usecase/get-active-price.usecase';
import { GetPriceHistoryUseCase } from '../../../application/usecase/get-price-history.usecase';
import { BranchPricingTableComponent } from '../../components/branch-pricing-table/branch-pricing-table.component';
import { SetPriceDialogComponent } from '../../components/set-price-dialog/set-price-dialog.component';
import { BranchPricingPageComponent } from './branch-pricing.page';

// Unitario: selección de sucursal, apertura del diálogo y guardado del precio.
// La fachada de pricing es la real (use cases stub); la tabla se sustituye por un mock.
describe('BranchPricingPageComponent', () => {
  let fixture: ComponentFixture<BranchPricingPageComponent>;
  let page: BranchPricingPageComponent;
  let facade: BranchPricingFacade;
  let toast: ToastService;
  let dialogOpen: jest.SpyInstance;
  let closed$: Subject<SetBranchPricePayload | null | undefined>;

  const branchesSignal = signal<readonly Branch[]>([]);
  const loadBranches = jest.fn();
  const setPriceUseCase = jest.fn();

  const makeBranch = (id: number, nombre: string, ubicacion: string): Branch => ({
    id,
    nombreSucursal: nombre,
    codigoSucursal: `SUC-${id}`,
    ubicacion,
    codigoPostal: '12345',
    numeroTelefono: '5512345678',
    correoElectronico: 'suc@trt.com',
  });
  const createdPrice: BranchPrice = {
    id: 1,
    idProducto: 41,
    idSucursal: 2,
    precioVenta: 12.5,
    vigenteDesde: '2026-03-01T10:00:00-06:00',
    activo: true,
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const select = () => el().querySelector('#branch-select') as HTMLSelectElement;
  const tableDebug = () => fixture.debugElement.query(By.directive(MockComponent(BranchPricingTableComponent)));

  function chooseBranch(label: string): void {
    const option = Array.from(select().options).find((o) => o.textContent?.includes(label));
    if (!option) throw new Error(`Opción no encontrada: ${label}`);
    select().value = option.value;
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    branchesSignal.set([makeBranch(2, 'Centro', 'Calle 1'), makeBranch(3, 'Norte', 'Av. 5')]);
    closed$ = new Subject();
    dialogOpen = jest.spyOn(Dialog.prototype, 'open').mockReturnValue({ closed: closed$ } as never);

    TestBed.configureTestingModule({
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ Building })),
        { provide: BranchesFacade, useValue: { branches: branchesSignal.asReadonly(), loadBranches } },
        { provide: SetBranchPriceUseCase, useValue: { execute: setPriceUseCase } },
        { provide: DeactivatePriceUseCase, useValue: { execute: jest.fn() } },
        { provide: GetActivePriceUseCase, useValue: { execute: jest.fn() } },
        { provide: GetPriceHistoryUseCase, useValue: { execute: jest.fn() } },
        { provide: LoggerService, useValue: { withContext: () => ({ error: jest.fn() }) } },
      ],
    });
    TestBed.overrideComponent(BranchPricingPageComponent, {
      remove: { imports: [BranchPricingTableComponent] },
      add: { imports: [MockComponent(BranchPricingTableComponent)] },
    });

    facade = TestBed.inject(BranchPricingFacade);
    toast = TestBed.inject(ToastService);
    jest.spyOn(toast, 'success');
    fixture = TestBed.createComponent(BranchPricingPageComponent);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.restoreAllMocks());

  describe('inicio', () => {
    it('carga las sucursales al iniciar', () => {
      expect(loadBranches).toHaveBeenCalledTimes(1);
    });

    it('lista las sucursales con nombre y ubicación y el placeholder deshabilitado', () => {
      const options = Array.from(select().options).map((o) => o.textContent?.replace(/\s+/g, ' ').trim());

      expect(options).toEqual(['Selecciona una sucursal', 'Centro — Calle 1', 'Norte — Av. 5']);
      expect(select().options[0].disabled).toBe(true);
    });

    it('sin sucursal seleccionada muestra el estado vacío y no renderiza la tabla', () => {
      expect(page.selectedSucursalId()).toBeNull();
      expect(el().textContent).toContain('Selecciona una sucursal para gestionar sus precios.');
      expect(tableDebug()).toBeNull();
    });

    it('con la lista de sucursales vacía solo muestra el placeholder', () => {
      branchesSignal.set([]);
      fixture.detectChanges();

      expect(select().options).toHaveLength(1);
    });
  });

  describe('selección de sucursal', () => {
    it('onBranchChange publica la sucursal en la fachada', () => {
      page.onBranchChange(3);

      expect(facade.selectedSucursalId()).toBe(3);
      expect(page.selectedSucursalId()).toBe(3);
    });

    it('al elegir una sucursal renderiza la tabla con su id y oculta el estado vacío', () => {
      chooseBranch('Centro');

      expect(page.selectedSucursalId()).toBe(2);
      expect(tableDebug()).not.toBeNull();
      expect(tableDebug().componentInstance.sucursalId).toBe(2);
      expect(el().textContent).not.toContain('Selecciona una sucursal para gestionar sus precios.');
    });

    it('al cambiar de sucursal la tabla recibe el nuevo id', () => {
      chooseBranch('Centro');
      chooseBranch('Norte');

      expect(tableDebug().componentInstance.sucursalId).toBe(3);
    });
  });

  describe('fijar precio', () => {
    const payload: SetBranchPricePayload = { idProducto: 41, idSucursal: 2, precioVenta: 12.5 };

    function emitSetPrice(productId: number): void {
      chooseBranch('Centro');
      tableDebug().componentInstance.setPrice.emit(productId);
    }

    it('abre el diálogo con el producto y la sucursal seleccionada', () => {
      emitSetPrice(41);

      expect(dialogOpen).toHaveBeenCalledTimes(1);
      expect(dialogOpen).toHaveBeenCalledWith(SetPriceDialogComponent, {
        data: { idProducto: 41, idSucursal: 2 },
      });
    });

    it('guarda el precio devuelto por el diálogo tal cual y avisa con un toast de éxito', () => {
      setPriceUseCase.mockReturnValue(of(createdPrice));
      emitSetPrice(41);

      closed$.next(payload);

      expect(setPriceUseCase).toHaveBeenCalledWith(payload);
      expect(typeof setPriceUseCase.mock.calls[0][0].precioVenta).toBe('number');
      expect(toast.success).toHaveBeenCalledWith('Precio de sucursal actualizado correctamente');
    });

    it('no guarda ni avisa si el diálogo se cancela (null)', () => {
      emitSetPrice(41);

      closed$.next(null);

      expect(setPriceUseCase).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('no guarda ni avisa si el diálogo se cierra sin valor (undefined, p. ej. Escape)', () => {
      emitSetPrice(41);

      closed$.next(undefined);

      expect(setPriceUseCase).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('si el guardado falla no muestra el toast de éxito y deja el error en la fachada', () => {
      setPriceUseCase.mockReturnValue(throwError(() => new Error('precio_venta debe ser mayor a 0')));
      emitSetPrice(41);

      closed$.next(payload);

      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.errorMessage()).toBe('precio_venta debe ser mayor a 0');
      expect(facade.loading()).toBe(false);
    });

    it('onSetPrice abre el diálogo con los ids recibidos aunque no venga de la tabla', () => {
      page.onSetPrice({ productId: 7, sucursalId: 3 });

      expect(dialogOpen).toHaveBeenCalledWith(SetPriceDialogComponent, {
        data: { idProducto: 7, idSucursal: 3 },
      });
    });

    // H-34: antes `error: () => {}` dejaba al cajero sin aviso si fallaba el guardado.
    it('si el guardado falla muestra un toast de error con el mensaje', () => {
      jest.spyOn(toast, 'error');
      setPriceUseCase.mockReturnValue(throwError(() => new Error('precio_venta debe ser mayor a 0')));
      emitSetPrice(41);

      closed$.next(payload);

      expect(toast.error).toHaveBeenCalledWith('precio_venta debe ser mayor a 0');
    });

    // H-35: antes la tabla seguía mostrando el precio anterior tras guardar.
    it('tras fijar el precio con éxito recarga la tabla', () => {
      setPriceUseCase.mockReturnValue(of(createdPrice));
      emitSetPrice(41);
      const reload = jest.spyOn(tableDebug().componentInstance, 'reload');

      closed$.next(payload);

      expect(reload).toHaveBeenCalledTimes(1);
    });

    it('si el guardado falla no recarga la tabla', () => {
      jest.spyOn(toast, 'error');
      setPriceUseCase.mockReturnValue(throwError(() => new Error('boom')));
      emitSetPrice(41);
      const reload = jest.spyOn(tableDebug().componentInstance, 'reload');

      closed$.next(payload);

      expect(reload).not.toHaveBeenCalled();
    });
  });
});
