import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BanknoteIcon, CreditCard, ArrowLeftRightIcon, LucideAngularModule } from 'lucide-angular';

import { PaymentMethodSelectorComponent } from './payment-method-selector.component';
import { PaymentMethod } from '@features/sales/domain/entities/payment-method.entity';

// Funcional: selector de pago real. Sin dobles: solo el componente de producción.
describe('PaymentMethodSelectorComponent (funcional)', () => {
  let fixture: ComponentFixture<PaymentMethodSelectorComponent>;
  let component: PaymentMethodSelectorComponent;

  const methods: PaymentMethod[] = [
    { id: 2, tipo: 'TARJETA', descripcion: 'Tarjeta' },
    { id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' },
  ];

  // Iconos reales registrados como en producción (app.config usa LucideAngularModule.pick).
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(LucideAngularModule.pick({ BanknoteIcon, CreditCard, ArrowLeftRightIcon }))],
    });
  });

  function setup(list: PaymentMethod[], selected: PaymentMethod | null = null) {
    fixture = TestBed.createComponent(PaymentMethodSelectorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('paymentMethods', list);
    fixture.componentRef.setInput('selectedPayment', selected);
    fixture.detectChanges();
  }

  // Verifica que al cargar métodos con EFECTIVO quede auto-seleccionado sin interacción del usuario.
  it('auto-selecciona EFECTIVO al cargar los métodos', () => {
    const seen: PaymentMethod[] = [];
    fixture = TestBed.createComponent(PaymentMethodSelectorComponent);
    component = fixture.componentInstance;
    component.selectPayment.subscribe((m) => seen.push(m));
    fixture.componentRef.setInput('paymentMethods', methods);
    fixture.componentRef.setInput('selectedPayment', null);
    fixture.detectChanges();

    expect(seen).toEqual([{ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' }]);
  });

  // Verifica que el método seleccionado se marque visualmente como seleccionado.
  it('marca visualmente el método seleccionado', () => {
    setup(methods, methods[0]);

    const selected = fixture.nativeElement.querySelectorAll('button.payment-btn.selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('TARJETA');
  });

  // Verifica que sin métodos se muestre el aviso y no haya botones para elegir.
  it('sin métodos muestra el aviso y ningún botón', () => {
    setup([]);

    expect(fixture.nativeElement.textContent).toContain('No hay métodos de pago disponibles.');
    expect(fixture.nativeElement.querySelectorAll('button.payment-btn')).toHaveLength(0);
  });

  // Verifica que pulsar un método lo emita como selección del usuario.
  it('pulsar un método lo emite como selección', () => {
    setup(methods, methods[1]);

    let emitted: PaymentMethod | undefined;
    component.selectPayment.subscribe((m) => (emitted = m));
    const buttons = fixture.nativeElement.querySelectorAll('button.payment-btn') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();

    expect(emitted).toEqual(methods[0]);
  });

  // Verifica que no se auto-seleccione si ya hay un método elegido.
  it('no auto-selecciona EFECTIVO si ya hay método elegido', () => {
    const seen: PaymentMethod[] = [];
    fixture = TestBed.createComponent(PaymentMethodSelectorComponent);
    component = fixture.componentInstance;
    component.selectPayment.subscribe((m) => seen.push(m));
    fixture.componentRef.setInput('paymentMethods', methods);
    fixture.componentRef.setInput('selectedPayment', methods[0]);
    fixture.detectChanges();

    expect(seen).toEqual([]);
  });

  // Verifica que sin método tipo efectivo no se auto-seleccione ninguno.
  it('no auto-selecciona si no existe método efectivo', () => {
    const seen: PaymentMethod[] = [];
    fixture = TestBed.createComponent(PaymentMethodSelectorComponent);
    component = fixture.componentInstance;
    component.selectPayment.subscribe((m) => seen.push(m));
    fixture.componentRef.setInput('paymentMethods', [methods[0]]);
    fixture.componentRef.setInput('selectedPayment', null);
    fixture.detectChanges();

    expect(seen).toEqual([]);
  });

  // Verifica que la detección de "efectivo" no distinga mayúsculas/minúsculas.
  it('auto-selecciona "Efectivo" sin importar mayúsculas', () => {
    const seen: PaymentMethod[] = [];
    fixture = TestBed.createComponent(PaymentMethodSelectorComponent);
    component = fixture.componentInstance;
    component.selectPayment.subscribe((m) => seen.push(m));
    const cash: PaymentMethod = { id: 9, tipo: 'Efectivo MXN', descripcion: '' };
    fixture.componentRef.setInput('paymentMethods', [methods[0], cash]);
    fixture.componentRef.setInput('selectedPayment', null);
    fixture.detectChanges();

    expect(seen).toEqual([cash]);
  });

  // Verifica el icono por tipo de pago: tarjeta, transferencia y por defecto (billete).
  it('resolveIcon elige icono según el tipo de pago', () => {
    setup(methods);

    expect(component.resolveIcon({ id: 1, tipo: 'TARJETA', descripcion: '' })).toBe('CreditCard');
    expect(component.resolveIcon({ id: 2, tipo: 'Transferencia', descripcion: '' })).toBe('ArrowLeftRightIcon');
    expect(component.resolveIcon({ id: 3, tipo: 'EFECTIVO', descripcion: '' })).toBe('BanknoteIcon');
    expect(component.resolveIcon({ id: 4, tipo: 'VALES', descripcion: '' })).toBe('BanknoteIcon');
  });
});
