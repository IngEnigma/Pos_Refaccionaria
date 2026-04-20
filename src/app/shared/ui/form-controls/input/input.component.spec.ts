import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputComponent } from './input.component';
import { LucideAngularModule, Eye, EyeOff } from 'lucide-angular';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('InputComponent', () => {
  let component: InputComponent;
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        InputComponent,
        ReactiveFormsModule,
        LucideAngularModule.pick({ Eye, EyeOff })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar label visible cuando se provee', () => {
    fixture.componentRef.setInput('label', 'Nombre');
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Nombre');

    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-label')).toBeNull();
  });

  it('debería usar aria-label cuando no hay label visible', () => {
    fixture.componentRef.setInput('label', '');
    fixture.componentRef.setInput('ariaLabel', 'Correo electrónico');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-label')).toBe('Correo electrónico');
  });

  it('debería usar placeholder como último recurso para aria-label', () => {
    fixture.componentRef.setInput('label', '');
    fixture.componentRef.setInput('ariaLabel', '');
    fixture.componentRef.setInput('placeholder', 'Buscar');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input');
    expect(input.getAttribute('aria-label')).toBe('Buscar');
  });

  it('debería actualizar el valor interno cuando el input cambia', () => {
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'test text';
    input.dispatchEvent(new Event('input'));
    
    expect(component.value).toBe('test text');
  });

  it('debería alternar la visibilidad de la contraseña', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    expect(component.resolvedInputType()).toBe('password');
    expect(component.showPassword()).toBe(false);

    const toggleButton = fixture.nativeElement.querySelector('.password-toggle');
    toggleButton.click();
    fixture.detectChanges();

    expect(component.showPassword()).toBe(true);
    expect(component.resolvedInputType()).toBe('text');
  });

  it('debería mostrar mensaje de error si hasError es true', () => {
    fixture.componentRef.setInput('hasError', true);
    fixture.componentRef.setInput('errorMessage', 'Error fatal');
    fixture.detectChanges();

    const errorMsg = fixture.nativeElement.querySelector('.error-message');
    expect(errorMsg).toBeTruthy();
    expect(errorMsg.textContent).toContain('Error fatal');
  });
});
