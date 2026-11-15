import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantityControlComponent } from './quantity-control.component';

describe('QuantityControlComponent', () => {
  let fixture: ComponentFixture<QuantityControlComponent>;
  let component: QuantityControlComponent;

  beforeEach(() => {
    fixture = TestBed.createComponent(QuantityControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const buttons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('button.qty-circle') as NodeListOf<HTMLButtonElement>);
  const valueText = () => (fixture.nativeElement.querySelector('.qty-value') as HTMLElement).textContent?.trim();

  // Verifica que sin entrada el valor por defecto sea 1.
  it('muestra 1 por defecto', () => {
    expect(valueText()).toBe('1');
  });

  // Verifica que el valor de entrada se renderice.
  it('muestra el valor recibido', () => {
    fixture.componentRef.setInput('value', 7);
    fixture.detectChanges();

    expect(valueText()).toBe('7');
  });

  // Verifica que "+" emita increase y no decrease.
  it('emite increase al pulsar +', () => {
    const inc = jest.fn();
    const dec = jest.fn();
    component.increase.subscribe(inc);
    component.decrease.subscribe(dec);

    buttons()[1].click();

    expect(inc).toHaveBeenCalledTimes(1);
    expect(dec).not.toHaveBeenCalled();
  });

  // Verifica que "−" emita decrease y no increase.
  it('emite decrease al pulsar −', () => {
    const inc = jest.fn();
    const dec = jest.fn();
    component.increase.subscribe(inc);
    component.decrease.subscribe(dec);

    buttons()[0].click();

    expect(dec).toHaveBeenCalledTimes(1);
    expect(inc).not.toHaveBeenCalled();
  });

  // Verifica que el grupo tenga etiqueta accesible.
  it('expone el grupo con aria-label', () => {
    expect(fixture.nativeElement.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Control de cantidad');
  });
});
