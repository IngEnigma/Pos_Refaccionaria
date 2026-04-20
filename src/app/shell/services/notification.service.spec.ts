import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
  });

  it('deberia iniciar sin notificaciones', () => {
    expect(service.notifications()).toEqual([]);
  });

  it('deberia agregar notificaciones y default read=false', () => {
    service.add({
      id: 1,
      title: 'Stock bajo',
      type: 'warning',
    });

    expect(service.notifications()).toEqual([
      {
        id: 1,
        title: 'Stock bajo',
        type: 'warning',
        read: false,
      },
    ]);
  });

  it('deberia marcar una notificacion como leida', () => {
    service.add({ id: 1, title: 'N1' });
    service.add({ id: 2, title: 'N2' });

    service.markAsRead(2);

    expect(service.notifications()).toEqual([
      { id: 1, title: 'N1', read: false },
      { id: 2, title: 'N2', read: true },
    ]);
  });

  it('deberia descartar una notificacion por id', () => {
    service.add({ id: 1, title: 'N1' });
    service.add({ id: 2, title: 'N2' });

    service.dismiss(1);

    expect(service.notifications()).toEqual([{ id: 2, title: 'N2', read: false }]);
  });

  it('deberia limpiar todas las notificaciones', () => {
    service.add({ id: 1, title: 'N1' });
    service.add({ id: 2, title: 'N2' });

    service.clear();

    expect(service.notifications()).toEqual([]);
  });
});
