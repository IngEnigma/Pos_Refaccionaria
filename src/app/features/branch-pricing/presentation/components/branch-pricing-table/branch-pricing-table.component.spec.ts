import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, DollarSign, OctagonX, Package } from 'lucide-angular';
import { of, Subject, throwError } from 'rxjs';

import { PaginatedResponse } from '@core/models/pagination.model';
import { Product, ProductStock } from '@features/inventory/domain/entities/product.entity';
import { ProductRepository } from '@features/inventory/domain/repository/product-repository';
import { BranchPricingTableComponent } from './branch-pricing-table.component';

// Unitario: carga de productos por sucursal, formato de dinero, estados y evento setPrice.
describe('BranchPricingTableComponent', () => {
  let fixture: ComponentFixture<BranchPricingTableComponent>;
  let component: BranchPricingTableComponent;
  let getProducts: jest.Mock;

  const makeProduct = (overrides: Partial<ProductStock> = {}): ProductStock => ({
    id: 1,
    idTipo: 1,
    idProveedor: 1,
    clave: 'FRE-001',
    nombre: 'Balata delantera',
    descripcion: null,
    codigoBarras: '7501',
    precioVenta: 100,
    marca: 'Brembo',
    costo: 60,
    codigoSat: null,
    cantidad: 10,
    precioSucursal: 85.5,
    precioBase: 100,
    vigenteDesde: null,
    idSucursal: 2,
    ...overrides,
  });

  const page = (data: ProductStock[]): PaginatedResponse<Product> => ({
    data,
    total: data.length,
    page: 1,
    pageSize: 200,
  });

  // sucursalId=0 no dispara la carga; los casos de renderizado siembran products/loading directamente.
  function setup(sucursalId = 0): void {
    TestBed.configureTestingModule({
      providers: [
        // Iconos lucide del template (producto y botón de acción).
        importProvidersFrom(LucideAngularModule.pick({ DollarSign, OctagonX, Package })),
        { provide: ProductRepository, useValue: { getProducts } },
      ],
    });
    fixture = TestBed.createComponent(BranchPricingTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('sucursalId', sucursalId);
    fixture.detectChanges();
  }

  function seed(products: ProductStock[]): void {
    component.products.set(products);
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll('tr.product-row'));
  const cells = (row: Element) => Array.from(row.querySelectorAll('td')).map((td) => td.textContent?.trim());

  beforeEach(() => {
    getProducts = jest.fn().mockReturnValue(of(page([])));
  });

  describe('carga', () => {
    // H-33: el efecto escribía señales sin allowSignalWrites y lanzaba NG0600.
    it('al recibir sucursalId consulta getProducts y muestra los productos', () => {
      getProducts.mockReturnValue(of(page([makeProduct({ nombre: 'Balata delantera' })])));

      setup(2);
      fixture.detectChanges(); // el efecto corre en el primer ciclo; el segundo pinta (OnPush)

      expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 200 }, { sucursalId: 2 });
      expect(rows()).toHaveLength(1);
      expect(el().textContent).toContain('Balata delantera');
    });

    it('al cambiar sucursalId vuelve a consultar productos', () => {
      setup(2);

      fixture.componentRef.setInput('sucursalId', 3);
      fixture.detectChanges();

      expect(getProducts).toHaveBeenCalledTimes(2);
      expect(getProducts).toHaveBeenLastCalledWith({ page: 1, limit: 200 }, { sucursalId: 3 });
    });

    it('mientras carga muestra 5 filas esqueleto y al terminar los datos', () => {
      const pending = new Subject<PaginatedResponse<Product>>();
      getProducts.mockReturnValue(pending);

      setup(2);
      fixture.detectChanges();
      expect(el().querySelectorAll('app-skeleton')).toHaveLength(5 * 7);

      pending.next(page([makeProduct()]));
      pending.complete();
      fixture.detectChanges();

      expect(el().querySelectorAll('app-skeleton')).toHaveLength(0);
      expect(rows()).toHaveLength(1);
    });

    it('reload vuelve a consultar los productos de la sucursal actual (H-35)', () => {
      setup(2);
      fixture.detectChanges();
      getProducts.mockClear();

      component.reload();

      expect(getProducts).toHaveBeenCalledTimes(1);
      expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 200 }, { sucursalId: 2 });
    });

    it('reload no consulta si la sucursal es 0 (falsy)', () => {
      setup(0);

      component.reload();

      expect(getProducts).not.toHaveBeenCalled();
    });

    it('no consulta productos si la sucursal es 0 (falsy)', () => {
      setup(0);

      expect(getProducts).not.toHaveBeenCalled();
    });

    it('muestra 5 filas esqueleto y oculta datos mientras loading es true', () => {
      setup();
      component.products.set([makeProduct()]);

      component.loading.set(true);
      fixture.detectChanges();

      expect(el().querySelectorAll('app-skeleton')).toHaveLength(5 * 7);
      expect(rows()).toHaveLength(0);
      expect(el().textContent).not.toContain('No se encontraron productos');
    });

    it('quita el esqueleto cuando loading vuelve a false', () => {
      setup();
      component.loading.set(true);
      fixture.detectChanges();

      component.loading.set(false);
      fixture.detectChanges();

      expect(el().querySelectorAll('app-skeleton')).toHaveLength(0);
    });

    // loadProducts es privado: se invoca directamente porque el efecto que debería
    // dispararlo está roto. Cuando se corrija, reemplazar por pruebas vía sucursalId.
    describe('loadProducts (invocado directamente)', () => {
      const load = (id: number) => (component as unknown as { loadProducts(id: number): void }).loadProducts(id);

      beforeEach(() => setup());

      it('pide hasta 200 productos de la sucursal y los publica', () => {
        getProducts.mockReturnValue(of(page([makeProduct({ id: 9 })])));

        load(2);

        expect(getProducts).toHaveBeenCalledWith({ page: 1, limit: 200 }, { sucursalId: 2 });
        expect(component.products().map((p) => p.id)).toEqual([9]);
        expect(component.loading()).toBe(false);
      });

      it('mantiene loading=true mientras la petición está pendiente', () => {
        getProducts.mockReturnValue(new Subject());

        load(2);

        expect(component.loading()).toBe(true);
      });

      it('deja la lista vacía y apaga loading si la carga falla (el error se traga)', () => {
        getProducts.mockReturnValue(throwError(() => new Error('boom')));

        load(2);

        expect(component.products()).toEqual([]);
        expect(component.loading()).toBe(false);
      });
    });
  });

  describe('listado', () => {
    beforeEach(() => setup());

    it('renderiza nombre, clave, marca, precio base y precio de sucursal en dinero con 2 decimales', () => {
      seed([makeProduct({ precioVenta: 100, precioSucursal: 85.5 })]);

      const [row] = rows();
      const text = cells(row);
      expect(text[0]).toContain('Balata delantera');
      expect(text[1]).toBe('FRE-001');
      expect(text[2]).toBe('Brembo');
      expect(text[3]).toBe('$100.00');
      expect(text[4]).toBe('$85.50');
    });

    it('marca "Activo" cuando el producto tiene precio de sucursal', () => {
      seed([makeProduct({ precioSucursal: 85.5 })]);

      const badge = el().querySelector('.status-badge') as HTMLElement;
      expect(badge.textContent?.trim()).toBe('Activo');
      expect(badge).toHaveClass('badge-active');
    });

    it('muestra "—" y "Sin precio" cuando el producto no tiene precio de sucursal', () => {
      seed([makeProduct({ precioSucursal: null })]);

      const [row] = rows();
      expect(cells(row)[4]).toBe('—');
      const badge = el().querySelector('.status-badge') as HTMLElement;
      expect(badge.textContent?.trim()).toBe('Sin precio');
      expect(badge).toHaveClass('badge-inactive');
    });

    it('muestra un precio de sucursal 0 como $0.00 y "Activo" (0 no es ausencia de precio)', () => {
      seed([makeProduct({ precioSucursal: 0 })]);

      const [row] = rows();
      expect(cells(row)[4]).toBe('$0.00');
      expect(cells(row)[5]).toBe('Activo');
    });

    it('renderiza una fila por producto', () => {
      seed([makeProduct({ id: 1 }), makeProduct({ id: 2 }), makeProduct({ id: 3 })]);

      expect(rows()).toHaveLength(3);
    });

    it('muestra el estado vacío cuando no hay productos', () => {
      seed([]);

      expect(el().textContent).toContain('No se encontraron productos para esta sucursal.');
      expect(rows()).toHaveLength(0);
    });
  });

  describe('acción fijar precio', () => {
    it('emite setPrice con el id del producto de la fila pulsada', () => {
      setup();
      seed([makeProduct({ id: 41 }), makeProduct({ id: 42 })]);
      const emitted: number[] = [];
      component.setPrice.subscribe((id) => emitted.push(id));

      const buttons = el().querySelectorAll<HTMLButtonElement>('button.set-price');
      buttons[1].click();

      expect(emitted).toEqual([42]);
    });
  });

  it('el botón de fijar precio dice "Fijar" (H-50) y nombra el producto', () => {
    setup();
    seed([makeProduct({ nombre: 'Balata delantera' })]);

    const btn = el().querySelector('button.set-price') as HTMLButtonElement;

    expect(btn.textContent).toContain('Fijar');
    expect(btn.textContent).not.toContain('Fixar');
    expect(btn.getAttribute('aria-label')).toBe('Fijar precio de Balata delantera');
  });

  describe('acción desactivar precio (H-37)', () => {
    it('solo se ofrece con precio de sucursal y emite deactivatePrice con el id del producto', () => {
      setup();
      seed([makeProduct({ id: 41, precioSucursal: null }), makeProduct({ id: 42, precioSucursal: 50 })]);
      const emitted: number[] = [];
      component.deactivatePrice.subscribe((id) => emitted.push(id));

      const buttons = el().querySelectorAll<HTMLButtonElement>('button.deactivate-price');
      expect(buttons).toHaveLength(1);
      buttons[0].click();

      expect(emitted).toEqual([42]);
    });
  });

  describe('formatPrice', () => {
    beforeEach(() => setup());

    it.each([
      [12.5, '$12.50'],
      [100, '$100.00'],
      [0, '$0.00'],
      [0.1, '$0.10'],
      [1234.567, '$1234.57'],
      [10.999, '$11.00'],
      [-5, '$-5.00'],
    ])('formatea %p como %s', (price, expected) => {
      expect(component.formatPrice(price)).toBe(expected);
    });

    it('devuelve "—" para null y undefined', () => {
      expect(component.formatPrice(null)).toBe('—');
      expect(component.formatPrice(undefined as unknown as null)).toBe('—');
    });

    // H-36
    it('muestra "—" y "Sin precio" (no "$NaN" ni "Activo") si recibe NaN', () => {
      expect(component.formatPrice(NaN)).toBe('—');
      expect(component.getBadgeText(NaN)).toBe('Sin precio');
    });

  });

  describe('badges', () => {
    beforeEach(() => setup());

    it('getBadgeClass devuelve badge-active con precio y badge-inactive sin precio', () => {
      expect(component.getBadgeClass(10)).toBe('badge-active');
      expect(component.getBadgeClass(0)).toBe('badge-active');
      expect(component.getBadgeClass(null)).toBe('badge-inactive');
    });

    it('getBadgeText devuelve Activo con precio y "Sin precio" sin precio', () => {
      expect(component.getBadgeText(10)).toBe('Activo');
      expect(component.getBadgeText(0)).toBe('Activo');
      expect(component.getBadgeText(null)).toBe('Sin precio');
    });
  });
});
