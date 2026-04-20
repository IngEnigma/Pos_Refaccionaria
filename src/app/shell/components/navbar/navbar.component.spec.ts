import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { LucideAngularModule, User, LogOut, CircleAlert, Search, Bell } from 'lucide-angular';
import { NotificationItem } from '@shell/models/notification.model';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NavbarComponent,
        LucideAngularModule.pick({ User, LogOut, CircleAlert, Search, Bell })
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    
    fixture.componentRef.setInput('username', 'testuser');
    fixture.componentRef.setInput('currentDate', '2024-01-01');
    
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('emite logoutClick al hacer click en "Cerrar sesión"', fakeAsync(() => {
    const logoutSpy = jest.fn();
    component.logoutClick.subscribe(logoutSpy);

    const profileButton = fixture.nativeElement.querySelector(
      'button[aria-label="Perfil"]',
    ) as HTMLButtonElement;
    profileButton.click();
    tick();
    fixture.detectChanges();

    const logoutButton = Array.from(
      document.body.querySelectorAll('button.dropdown-item'),
    ).find((button) => button.textContent?.includes('Cerrar sesión')) as
      | HTMLButtonElement
      | undefined;

    expect(logoutButton).toBeTruthy();
    logoutButton?.click();
    tick();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  }));

  it('emite searchChange al escribir en búsqueda', fakeAsync(() => {
    const searchSpy = jest.fn();
    component.searchChange.subscribe(searchSpy);

    const input = fixture.nativeElement.querySelector(
      'input.search-input',
    ) as HTMLInputElement;
    input.value = 'filtro aceite';
    input.dispatchEvent(new Event('input'));

    tick(300);
    fixture.detectChanges();

    expect(searchSpy).toHaveBeenCalledWith('filtro aceite');
  });

  it('renderiza notificaciones cuando recibe datos', fakeAsync(() => {
    const notifications: NotificationItem[] = [
      { id: 1, title: 'Stock bajo', description: '2 piezas' },
      { id: 2, title: 'Pedido pendiente' },
    ];

    fixture.componentRef.setInput('notifications', notifications);
    tick();
    fixture.detectChanges();

    const notificationsButton = fixture.nativeElement.querySelector(
      'button[aria-label="Notificaciones"]',
    ) as HTMLButtonElement;
    notificationsButton.click();
    tick();
    fixture.detectChanges();

    const overlayText = document.body.textContent ?? '';
    expect(overlayText).toContain('Stock bajo');
    expect(overlayText).toContain('Pedido pendiente');
  }));
});
