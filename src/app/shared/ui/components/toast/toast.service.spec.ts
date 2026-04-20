import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeAll(() => {
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: () => 'test-uuid' },
    });
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debería mostrar un toast con mensaje por defecto si no se provee uno', () => {
    service.success();
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Operación realizada con éxito');
    expect(toasts[0].type).toBe('success');
  });

  it('debería mostrar un toast con mensaje personalizado', () => {
    service.show('Test Message', 'info');
    const toasts = service.toasts();
    expect(toasts[0].message).toBe('Test Message');
    expect(toasts[0].type).toBe('info');
  });

  it('debería eliminar el toast automáticamente después de la duración', fakeAsync(() => {
    service.show('Test', 'info', 1000);
    expect(service.toasts().length).toBe(1);
    
    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));

  it('debería limpiar el timer si se elimina manualmente antes de tiempo', fakeAsync(() => {
    service.show('Test', 'info', 1000);
    const toastId = service.toasts()[0].id;
    
    service.dismiss(toastId);
    expect(service.toasts().length).toBe(0);
    
    tick(1000);
    expect(service.toasts().length).toBe(0);
  }));

  it('debería usar el mensaje personalizado en error() si se provee', () => {
    service.error('Error crítico');
    expect(service.toasts()[0].message).toBe('Error crítico');
  });

  it('debería usar el mensaje genérico en error() si no se provee nada', () => {
    service.error();
    expect(service.toasts()[0].message).toBe('Error, por favor intente de nuevo');
  });

  it('debería limitar la cantidad de toasts activos a 5', () => {
    let count = 0;
    jest.spyOn(crypto, 'randomUUID').mockImplementation(() => `uuid-${count++}`);

    for (let i = 0; i < 10; i++) {
      service.show(`Toast ${i}`);
    }
    expect(service.toasts().length).toBe(5);
    expect(service.toasts()[4].message).toBe('Toast 9');
    
    jest.restoreAllMocks();
  });
});
