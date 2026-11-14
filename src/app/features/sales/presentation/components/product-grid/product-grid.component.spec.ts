import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LucideAngularModule, Package } from 'lucide-angular';

import { ProductGridComponent } from './product-grid.component';
import { SalesProduct } from '../../models/sales-ui.models';

type IoCallback = (entries: Array<Pick<IntersectionObserverEntry, 'isIntersecting'>>) => void;

describe('ProductGridComponent', () => {
  let fixture: ComponentFixture<ProductGridComponent>;
  let component: ProductGridComponent;
  let ioCallback: IoCallback;
  const observe = jest.fn();
  const disconnect = jest.fn();
  const original = (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;

  const product = (id: number, nombre: string): SalesProduct => ({
    id,
    nombre,
    descripcion: `C-${id}`,
    precio: 10 * id,
    stock: 5,
    codigoBarras: `750${id}`,
    imagen: 'x.webp',
    hasSucursalPrice: false,
  });

  beforeEach(() => {
    observe.mockClear();
    disconnect.mockClear();
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = class {
      constructor(cb: IoCallback) {
        ioCallback = cb;
      }
      observe = observe;
      disconnect = disconnect;
    };
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(LucideAngularModule.pick({ Package }))],
    });
    fixture = TestBed.createComponent(ProductGridComponent);
    component = fixture.componentInstance;
  });

  afterAll(() => {
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = original;
  });

  const cards = () => fixture.nativeElement.querySelectorAll('app-product-card');
  const skeletons = () => fixture.nativeElement.querySelectorAll('app-product-card-skeleton');

  // Verifica que sin productos ni carga no haya tarjetas ni esqueletos.
  it('no renderiza tarjetas ni esqueletos vacío', () => {
    fixture.detectChanges();

    expect(cards()).toHaveLength(0);
    expect(skeletons()).toHaveLength(0);
  });

  // Verifica que se renderice una tarjeta por producto.
  it('renderiza una tarjeta por producto', () => {
    fixture.componentRef.setInput('products', [product(1, 'Filtro'), product(2, 'Bujía')]);
    fixture.detectChanges();

    expect(cards()).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Bujía');
  });

  // Verifica los 15 esqueletos mientras carga.
  it('muestra 15 esqueletos mientras carga', () => {
    fixture.componentRef.setInput('loadingProducts', true);
    fixture.detectChanges();

    expect(skeletons()).toHaveLength(15);
  });

  // Verifica que Añadir en una tarjeta emita addToCart con el producto.
  it('emite addToCart con el producto de la tarjeta', () => {
    const spy = jest.fn();
    component.addToCart.subscribe(spy);
    const p = product(1, 'Filtro');
    fixture.componentRef.setInput('products', [p]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('app-product-card button') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledWith(p);
  });

  // Verifica que se observe el sentinel con margen de 200px.
  it('observa el sentinel al iniciar', () => {
    fixture.detectChanges();

    expect(observe).toHaveBeenCalledWith(fixture.nativeElement.querySelector('.scroll-sentinel'));
  });

  // Verifica que el sentinel visible emita loadMore.
  it('emite loadMore cuando el sentinel entra en vista', () => {
    const spy = jest.fn();
    component.loadMore.subscribe(spy);
    fixture.detectChanges();

    ioCallback([{ isIntersecting: true }]);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Verifica que sentinel no visible no emita.
  it('no emite loadMore si el sentinel no está en vista', () => {
    const spy = jest.fn();
    component.loadMore.subscribe(spy);
    fixture.detectChanges();

    ioCallback([{ isIntersecting: false }]);

    expect(spy).not.toHaveBeenCalled();
  });

  // Verifica que no se pida más mientras ya está cargando.
  it('no emite loadMore mientras carga', () => {
    const spy = jest.fn();
    component.loadMore.subscribe(spy);
    fixture.componentRef.setInput('loadingProducts', true);
    fixture.detectChanges();

    ioCallback([{ isIntersecting: true }]);

    expect(spy).not.toHaveBeenCalled();
  });

  // Verifica que al destruir se desconecte el observer.
  it('desconecta el observer al destruirse', () => {
    fixture.detectChanges();

    fixture.destroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
