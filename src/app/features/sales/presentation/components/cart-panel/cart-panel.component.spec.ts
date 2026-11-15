import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArrowLeftRightIcon, BanknoteIcon, CreditCard, LucideAngularModule, Trash2 } from 'lucide-angular';

import { CartPanelComponent } from './cart-panel.component';
import { SalesCartItem } from '../../models/sales-ui.models';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';

describe('CartPanelComponent', () => {
  let fixture: ComponentFixture<CartPanelComponent>;
  let component: CartPanelComponent;

  const items: SalesCartItem[] = [
    { productId: 1, nombre: 'Filtro', descripcion: 'F-1', precio: 100, imagen: 'a.webp', qty: 1, stock: 5 },
    { productId: 2, nombre: 'Bujía', descripcion: 'B-2', precio: 35, imagen: 'b.webp', qty: 2, stock: 5 },
  ];
  const efectivo: PaymentMethod = { id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' };
  const tarjeta: PaymentMethod = { id: 2, tipo: 'TARJETA', descripcion: 'Tarjeta' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(LucideAngularModule.pick({ BanknoteIcon, CreditCard, ArrowLeftRightIcon, Trash2 }))],
    });
    fixture = TestBed.createComponent(CartPanelComponent);
    component = fixture.componentInstance;
  });

  const set = (name: string, value: unknown) => fixture.componentRef.setInput(name, value);
  const el = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement | null;
  const processButton = () => el('app-button button') as HTMLButtonElement;

  // Verifica el mensaje de carrito vacío.
  it('muestra mensaje de carrito vacío sin items', () => {
    fixture.detectChanges();

    expect(el('.cart-list .empty-cart')?.textContent).toContain('No hay productos agregados.');
    expect(fixture.nativeElement.querySelectorAll('app-cart-item')).toHaveLength(0);
  });

  // Verifica que se renderice un app-cart-item por producto.
  it('renderiza un renglón por producto', () => {
    set('cartItems', items);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-cart-item')).toHaveLength(2);
    expect(el('.cart-list .empty-cart')).toBeNull();
  });

  // Verifica la etiqueta de cliente por defecto y una personalizada.
  it('muestra "Público general" por defecto y la etiqueta recibida', () => {
    fixture.detectChanges();
    expect(el('[data-testid="cliente-actual"]')?.textContent?.trim()).toBe('Público general');

    set('clienteLabel', 'Juan Pérez');
    fixture.detectChanges();
    expect(el('[data-testid="cliente-actual"]')?.textContent?.trim()).toBe('Juan Pérez');
  });

  // Verifica que Cambiar emita changeCliente.
  it('emite changeCliente al pulsar Cambiar', () => {
    const spy = jest.fn();
    component.changeCliente.subscribe(spy);
    fixture.detectChanges();

    (el('button.client-change') as HTMLButtonElement).click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Verifica que +, − y eliminar de un renglón suban como outputs del panel con el item.
  it('reenvía removeItem, increaseQty y decreaseQty con el item', () => {
    const rm = jest.fn();
    const inc = jest.fn();
    const dec = jest.fn();
    component.removeItem.subscribe(rm);
    component.increaseQty.subscribe(inc);
    component.decreaseQty.subscribe(dec);
    set('cartItems', items);
    fixture.detectChanges();
    const first = fixture.nativeElement.querySelector('app-cart-item') as HTMLElement;
    const [minus, plus] = Array.from(first.querySelectorAll('.qty-circle') as NodeListOf<HTMLButtonElement>);

    plus.click();
    minus.click();
    (first.querySelector('.remove-btn') as HTMLButtonElement).click();

    expect(inc).toHaveBeenCalledWith(items[0]);
    expect(dec).toHaveBeenCalledWith(items[0]);
    expect(rm).toHaveBeenCalledWith(items[0]);
  });

  // Verifica que los importes se pasen al resumen.
  it('pasa subtotal, IVA y total al resumen', () => {
    set('subtotal', 100);
    set('iva', 16);
    set('total', 116);
    fixture.detectChanges();

    expect(el('app-sales-summary')?.textContent?.replace(/\s+/g, '')).toContain('Subtotal$100.00');
    expect(el('.total-amount')?.textContent?.trim()).toBe('$116.00');
  });

  // Verifica que elegir método de pago emita selectPayment con el método.
  it('reenvía selectPayment al elegir un método', () => {
    const spy = jest.fn();
    component.selectPayment.subscribe(spy);
    set('paymentMethods', [efectivo, tarjeta]);
    set('selectedPayment', efectivo);
    fixture.detectChanges();
    spy.mockClear();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button.payment-btn') as NodeListOf<HTMLButtonElement>);
    buttons.find((b) => b.textContent?.includes('TARJETA'))?.click();

    expect(spy).toHaveBeenCalledWith(tarjeta);
  });

  // Verifica que el botón procesar emita processTransaction cuando está habilitado.
  it('emite processTransaction al pulsar Procesar', () => {
    const spy = jest.fn();
    component.processTransaction.subscribe(spy);
    fixture.detectChanges();

    processButton().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Verifica que deshabilitado no emita.
  it('no emite processTransaction si está deshabilitado', () => {
    const spy = jest.fn();
    component.processTransaction.subscribe(spy);
    set('disabled', true);
    fixture.detectChanges();

    expect(processButton().disabled).toBe(true);
    processButton().click();

    expect(spy).not.toHaveBeenCalled();
  });

  // Verifica que loading muestre el texto de progreso, deshabilite el botón y no emita.
  it('muestra "Procesando transacción..." y no emite mientras carga', () => {
    const spy = jest.fn();
    component.processTransaction.subscribe(spy);
    set('loading', true);
    fixture.detectChanges();

    expect(processButton().disabled).toBe(true);
    expect(el('.button-loading')?.textContent).toContain('Procesando transacción...');
    processButton().click();

    expect(spy).not.toHaveBeenCalled();
  });
});
