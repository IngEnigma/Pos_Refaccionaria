import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería emitir evento click nativo', () => {
    const spy = jest.fn();
    fixture.nativeElement.querySelector('button').addEventListener('click', spy);
    
    fixture.nativeElement.querySelector('button').click();
    
    expect(spy).toHaveBeenCalled();
  });

  it('debería aplicar clases de variante y tamaño', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('button-danger')).toBeTruthy();
    expect(button.classList.contains('button-lg')).toBeTruthy();
  });

  it('debería estar deshabilitado cuando loading es true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTruthy();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });
});
