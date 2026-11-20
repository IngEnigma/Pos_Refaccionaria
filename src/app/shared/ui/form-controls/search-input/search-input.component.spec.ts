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

  // Lector de código de barras: Enter emite al instante, sin esperar el debounce.
  it('Enter emite searchSubmit con el texto recortado', () => {
    fixture.detectChanges();
    const submitted: string[] = [];
    component.searchSubmit.subscribe((q) => submitted.push(q));

    const input = getInputByAriaLabel('Buscar...');
    input.value = ' 7501 ';
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(submitted).toEqual(['7501']);
  });

  // clear() vacía el campo y descarta el texto pendiente del debounce.
  it('clear vacía el campo y emite búsqueda vacía', fakeAsync(() => {
    fixture.detectChanges();
    const changes: string[] = [];
    component.searchChange.subscribe((q) => changes.push(q));

    const input = getInputByAriaLabel('Buscar...');
    input.value = '7501';
    input.dispatchEvent(new Event('input'));
    component.clear();
    tick(300);

    expect(input.value).toBe('');
    expect(changes).not.toContain('7501');
  }));
});
