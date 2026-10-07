import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCardComponent } from './product-card.component';
import { SalesProduct } from '../../models/sales-ui.models';

// Funcional: tarjeta de producto real. Sin dobles: el ButtonComponent hijo es el de producción.
describe('ProductCardComponent (funcional)', () => {
  let fixture: ComponentFixture<ProductCardComponent>;
  let component: ProductCardComponent;

  const product: SalesProduct = {
    id: 101,
    nombre: 'Filtro de aceite',
    descripcion: 'FLT-1234',
    precio: 120,
    stock: 5,
    codigoBarras: '7501234567890',
    imagen: 'assets/images/Refaccionaria.webp',
    hasSucursalPrice: true,
  };

  function setup(p: SalesProduct) {
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', p);
    fixture.detectChanges();
  }

  // Verifica que la tarjeta muestre los datos observables del producto (nombre, precio y stock).
  it('muestra nombre, precio y stock del producto', () => {
    setup(product);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Filtro de aceite');
    expect(text).toContain('120');
    expect(text).toContain('5');
  });

  // Verifica que pulsar "Añadir" emita el producto para agregarlo al carrito.
  it('pulsar Añadir emite el producto', () => {
    setup(product);

    let emitted: SalesProduct | undefined;
    component.addToCart.subscribe((p) => (emitted = p));
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toEqual(product);
  });

  // Verifica que con stock 0 el botón quede deshabilitado (el usuario no puede añadirlo).
  it('con stock 0 el botón Añadir queda deshabilitado', () => {
    setup({ ...product, stock: 0 });

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  // Verifica que con stock 0 pulsar no emita nada (doble protección junto al servicio).
  it('con stock 0 pulsar no emite el producto', () => {
    setup({ ...product, stock: 0 });

    let emitted = 0;
    component.addToCart.subscribe(() => emitted++);
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toBe(0);
  });
});
