import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconButtonComponent } from './icon-button.component';
import { LucideAngularModule, Search } from 'lucide-angular';

describe('IconButtonComponent', () => {
  let component: IconButtonComponent;
  let fixture: ComponentFixture<IconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IconButtonComponent,
        LucideAngularModule.pick({ Search })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IconButtonComponent);
    component = fixture.componentInstance;
    // @ts-ignore - setting required inputs
    fixture.componentRef.setInput('icon', 'search');
    // @ts-ignore
    fixture.componentRef.setInput('label', 'Search');
    fixture.detectChanges();
  });

  it('debería tener aria-label correcto', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Search');
  });

  it('debería tener aria-pressed según el estado isActive', () => {
    const button = fixture.nativeElement.querySelector('button');
    
    // Initial state
    expect(button.getAttribute('aria-pressed')).toBe('false');

    // Set active
    fixture.componentRef.setInput('isActive', true);
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('debería estar deshabilitado cuando loading es true', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTruthy();
    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('debería aplicar la clase de variante', () => {
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.classList.contains('button-danger')).toBeTruthy();
  });
});
