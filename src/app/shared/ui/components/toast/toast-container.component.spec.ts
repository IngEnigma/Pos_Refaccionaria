import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from './toast.service';
import { LucideAngularModule, CircleAlert, CircleCheck, TriangleAlert, OctagonX } from 'lucide-angular';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  const getContainer = (): HTMLElement =>
    fixture.nativeElement.querySelector('[aria-live="polite"][aria-label="Notificaciones"]');

  const getStatusToasts = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="status"]')) as HTMLElement[];

  const getCloseButtonByName = (name: string): HTMLButtonElement => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const match = buttons.find((btn) => btn.getAttribute('aria-label') === name);
    if (!match) {
      throw new Error(`Botón con aria-label="${name}" no encontrado`);
    }
    return match;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ToastContainerComponent,
        NoopAnimationsModule,
        LucideAngularModule.pick({ CircleAlert, CircleCheck, TriangleAlert, OctagonX }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('debería exponer aria-live y nombre accesible del contenedor', () => {
    expect(getContainer()).toBeTruthy();
  });

  it('debería renderizar toasts con role="status"', fakeAsync(() => {
    toastService.success('Guardado');
    fixture.detectChanges();
    tick();

    const toasts = getStatusToasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].textContent).toContain('Guardado');
  }));

  it('debería cerrar un toast desde el botón "Cerrar"', fakeAsync(() => {
    toastService.info('Mensaje');
    fixture.detectChanges();
    tick();

    expect(getStatusToasts().length).toBe(1);

    const closeButton = getCloseButtonByName('Cerrar');
    closeButton.click();
    fixture.detectChanges();
    tick();

    expect(getStatusToasts().length).toBe(0);
  }));
});
