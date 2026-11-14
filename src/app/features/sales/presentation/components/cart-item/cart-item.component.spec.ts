import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LucideAngularModule, Trash2 } from 'lucide-angular';

import { CartItemComponent } from './cart-item.component';
import { SalesCartItem } from '../../models/sales-ui.models';

describe('CartItemComponent', () => {
  let fixture: ComponentFixture<CartItemComponent>;
  let component: CartItemComponent;

  const item: SalesCartItem = {
    productId: 9,
    nombre: 'Filtro de aceite',
    descripcion: 'FLT-1234',
    precio: 120,
    imagen: 'assets/filtro.webp',
    qty: 3,
    stock: 10,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(LucideAngularModule.pick({ Trash2 }))],
    });
    fixture = TestBed.createComponent(CartItemComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', item);
    fixture.detectChanges();
  });

  const text = (sel: string) => (fixture.nativeElement.querySelector(sel) as HTMLElement).textContent?.trim();

  // Verifica que nombre, descripción, precio y cantidad se rendericen.
  it('renderiza nombre, descripción, precio y cantidad', () => {
    expect(text('.cart-item-name')).toBe('Filtro de aceite');
    expect(text('.cart-item-desc')).toBe('FLT-1234');
    expect(text('.cart-price')).toBe('$120');
    expect(text('.qty-value')).toBe('3');
  });

  // Verifica que la imagen use la ruta y el alt del producto.
  it('usa imagen y alt del producto', () => {
    const img = fixture.nativeElement.querySelector('img.cart-item-img') as HTMLImageElement;

    expect(img.getAttribute('src')).toBe('assets/filtro.webp');
    expect(img.getAttribute('alt')).toBe('Filtro de aceite');
  });

  // Verifica que eliminar emita el item completo.
  it('emite remove con el item al pulsar eliminar', () => {
    const spy = jest.fn();
    component.remove.subscribe(spy);

    (fixture.nativeElement.querySelector('.remove-btn') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledWith(item);
  });

  // Verifica que + y − emitan el item correspondiente.
  it('emite increaseQty y decreaseQty con el item', () => {
    const inc = jest.fn();
    const dec = jest.fn();
    component.increaseQty.subscribe(inc);
    component.decreaseQty.subscribe(dec);
    const [minus, plus] = Array.from(fixture.nativeElement.querySelectorAll('.qty-circle') as NodeListOf<HTMLButtonElement>);

    plus.click();
    minus.click();

    expect(inc).toHaveBeenCalledWith(item);
    expect(dec).toHaveBeenCalledWith(item);
  });

  // Verifica que al cambiar el item se actualice la cantidad mostrada.
  it('actualiza la cantidad cuando cambia el item', () => {
    fixture.componentRef.setInput('item', { ...item, qty: 5 });
    fixture.detectChanges();

    expect(text('.qty-value')).toBe('5');
  });
});
