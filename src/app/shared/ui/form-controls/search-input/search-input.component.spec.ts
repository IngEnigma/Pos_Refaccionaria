import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';
import { LucideAngularModule, Search } from 'lucide-angular';

describe('SearchInputComponent', () => {
  let component: SearchInputComponent;
  let fixture: ComponentFixture<SearchInputComponent>;

  const getInputByAriaLabel = (label: string): HTMLInputElement => {
    return fixture.nativeElement.querySelector(`input[aria-label="${label}"]`);
  };

  const getInputByLabelText = (labelText: string): HTMLInputElement => {
    const labels = Array.from(fixture.nativeElement.querySelectorAll('label')) as HTMLLabelElement[];
    const label = labels.find((item) => item.textContent?.trim() === labelText);
    if (!label) {
      throw new Error(`Label "${labelText}" no encontrado`);
    }
    const inputId = label.getAttribute('for');
    if (!inputId) {
      throw new Error(`Label "${labelText}" no tiene atributo for`);
    }
    const input = fixture.nativeElement.querySelector(`#${inputId}`) as HTMLInputElement | null;
    if (!input) {
      throw new Error(`Input con id "${inputId}" no encontrado`);
    }
    return input;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SearchInputComponent,
        LucideAngularModule.pick({ Search })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse el componente', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debería exponer label visible y asociarlo con el input', () => {
    fixture.componentRef.setInput('label', 'Buscar productos');
    fixture.detectChanges();

    const input = getInputByLabelText('Buscar productos');
    expect(input).toBeTruthy();
  });

  it('debería usar aria-label cuando no hay label visible', () => {
    fixture.componentRef.setInput('label', '');
    fixture.componentRef.setInput('ariaLabel', 'Buscar por nombre');
    fixture.detectChanges();

    const input = getInputByAriaLabel('Buscar por nombre');
    expect(input).toBeTruthy();
  });

  it('debería usar placeholder como último recurso para aria-label', () => {
    fixture.componentRef.setInput('label', '');
    fixture.componentRef.setInput('ariaLabel', '');
    fixture.componentRef.setInput('placeholder', 'Buscar por SKU');
    fixture.detectChanges();

    const input = getInputByAriaLabel('Buscar por SKU');
    expect(input).toBeTruthy();
  });

  it('debería actualizar el valor después del debounce y emitir searchChange', fakeAsync(() => {
    const onChangeSpy = jest.fn();
    const searchChangeSpy = jest.fn();
    fixture.componentRef.setInput('debounceMs', 10);
    fixture.detectChanges();
    component.registerOnChange(onChangeSpy);
    component.searchChange.subscribe(searchChangeSpy);

    const input = getInputByAriaLabel('Buscar...');
    input.value = 'query';
    input.dispatchEvent(new Event('input'));

    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(searchChangeSpy).not.toHaveBeenCalled();

    tick(10);
    fixture.detectChanges();
    expect(component.value).toBe('query');
    expect(onChangeSpy).toHaveBeenCalledWith('query');
    expect(searchChangeSpy).toHaveBeenCalledWith('query');
  }));

  it('debería escribir valores desde el exterior (writeValue)', () => {
    fixture.detectChanges();
    component.writeValue('external');
    fixture.detectChanges();
    
    expect(component.value).toBe('external');
    const input = getInputByAriaLabel('Buscar...');
    expect(input.value).toBe('external');
  });

  it('debería marcar touched en blur', () => {
    const touchedSpy = jest.fn();
    fixture.detectChanges();
    component.registerOnTouched(touchedSpy);

    const input = getInputByAriaLabel('Buscar...');
    input.dispatchEvent(new Event('blur'));

    expect(touchedSpy).toHaveBeenCalledTimes(1);
  });
});
