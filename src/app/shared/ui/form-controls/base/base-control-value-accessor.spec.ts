import { Component } from '@angular/core';
import { BaseControlValueAccessor } from './base-control-value-accessor';
import { TestBed } from '@angular/core/testing';

@Component({
  template: '',
  standalone: true
})
class MockControlValueAccessor extends BaseControlValueAccessor<string> {
  constructor() {
    super();
    this.writeValue('initial');
  }

  testUpdateValue(val: string) {
    this.updateValue(val);
  }

  testMarkAsTouched() {
    this.markAsTouched();
  }
}

describe('BaseControlValueAccessor', () => {
  let component: MockControlValueAccessor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockControlValueAccessor]
    });
    const fixture = TestBed.createComponent(MockControlValueAccessor);
    component = fixture.componentInstance;
  });

  it('debería inicializarse con el valor inicial', () => {
    expect(component.value).toBe('initial');
  });

  it('debería actualizar el valor y notificar el cambio', () => {
    const spy = jest.fn();
    component.registerOnChange(spy);
    
    component.testUpdateValue('new value');
    
    expect(component.value).toBe('new value');
    expect(spy).toHaveBeenCalledWith('new value');
  });

  it('debería notificar cuando es tocado', () => {
    const spy = jest.fn();
    component.registerOnTouched(spy);
    
    component.testMarkAsTouched();
    
    expect(spy).toHaveBeenCalled();
  });

  it('debería escribir un nuevo valor desde el exterior', () => {
    component.writeValue('external value');
    expect(component.value).toBe('external value');
  });

  it('debería poner undefined si se escribe null', () => {
    component.writeValue(null);
    expect(component.value).toBeUndefined();
  });

  it('debería actualizar el estado deshabilitado', () => {
    component.setDisabledState(true);
    expect(component.disabled).toBe(true);
    
    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });
});
