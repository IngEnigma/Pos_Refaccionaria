import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Package, Pencil, Tag, Trash2 } from 'lucide-angular';

import { InventoryProductGridComponent } from './inventory-product-grid.component';
import { Product } from '@features/inventory/domain/entities/product.entity';

// Unitario: grid con IntersectionObserver simulado (jsdom no lo trae) para validar
// el disparo de loadMore y el render de skeletons.
describe('InventoryProductGridComponent', () => {
  let fixture: ComponentFixture<InventoryProductGridComponent>;
  let component: InventoryProductGridComponent;

  type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

  class FakeIntersectionObserver {
    static instances: FakeIntersectionObserver[] = [];
    observe = jest.fn();
    disconnect = jest.fn();

    constructor(private readonly callback: ObserverCallback) {
      FakeIntersectionObserver.instances.push(this);
    }

    trigger(isIntersecting: boolean): void {
      this.callback([{ isIntersecting }]);
    }
  }

  const makeProduct = (id: number): Product => ({
    id,
    idTipo: null,
    idProveedor: null,
    clave: `SKU-${id}`,
    nombre: `Producto ${id}`,
    descripcion: null,
    codigoBarras: `750${id}`,
    precioVenta: 100,
    marca: 'Marca',
    costo: 50,
    codigoSat: null,
  });

  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = FakeIntersectionObserver;

    TestBed.configureTestingModule({
      // Iconos lucide de las tarjetas hijas (Package, Pencil, Tag, Trash2).
      providers: [importProvidersFrom(LucideAngularModule.pick({ Package, Pencil, Tag, Trash2 }))],
    });
    fixture = TestBed.createComponent(InventoryProductGridComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)['IntersectionObserver'];
  });

  // Comprueba que al montarse se observe el sentinel para detectar el fin del scroll.
  it('observa el sentinel tras montarse', () => {
    fixture.detectChanges(); // ngAfterViewInit

    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(FakeIntersectionObserver.instances[0].observe).toHaveBeenCalled();
  });

  // Comprueba que cuando el sentinel entra en pantalla y no hay carga en curso se emita loadMore.
  it('emite loadMore al cruzar el sentinel con carga libre', () => {
    fixture.detectChanges();

    let emitted = 0;
    component.loadMore.subscribe(() => emitted++);

    FakeIntersectionObserver.instances[0].trigger(true);

    expect(emitted).toBe(1);
  });

  // Comprueba que con loadingProducts activo no se dispare loadMore (evita cargas duplicadas).
  it('no emite loadMore si ya hay una carga en curso', () => {
    fixture.componentRef.setInput('loadingProducts', true);
    fixture.detectChanges();

    let emitted = 0;
    component.loadMore.subscribe(() => emitted++);

    FakeIntersectionObserver.instances[0].trigger(true);

    expect(emitted).toBe(0);
  });

  // Comprueba que al destruirse el componente se desconecte el observer (sin fugas).
  it('desconecta el observer al destruirse', () => {
    fixture.detectChanges();

    fixture.destroy();

    expect(FakeIntersectionObserver.instances[0].disconnect).toHaveBeenCalled();
  });

  // Comprueba que mientras loadingProducts sea true se rendericen los skeletons y no productos.
  it('muestra skeletons mientras carga', () => {
    fixture.componentRef.setInput('products', []);
    fixture.componentRef.setInput('loadingProducts', true);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelectorAll('app-product-card-skeleton').length).toBe(15);
  });

  // Comprueba que los productos recibidos se rendericen como tarjetas.
  it('renderiza una tarjeta por producto', () => {
    fixture.componentRef.setInput('products', [makeProduct(1), makeProduct(2)]);
    fixture.componentRef.setInput('loadingProducts', false);
    fixture.detectChanges();

    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('app-inventory-product-card');
    expect(cards).toHaveLength(2);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Producto 1');
  });
});
