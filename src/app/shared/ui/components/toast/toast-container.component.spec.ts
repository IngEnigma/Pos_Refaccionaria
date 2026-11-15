import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
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
    flush();
  }));
});
