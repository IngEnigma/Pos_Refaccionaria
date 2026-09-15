import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { LucideAngularModule, User, LogOut, CircleAlert, Search, Bell } from 'lucide-angular';

@Component({
  selector: 'app-notifications-badge',
  standalone: true,
  template: '',
})
class MockNotificationsBadgeComponent {}

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
    .overrideComponent(NavbarComponent, {
      add: { imports: [MockNotificationsBadgeComponent] },
      remove: { imports: [] }
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
  }));

  it('renderiza el badge de notificaciones', () => {
    const badge = fixture.nativeElement.querySelector('app-notifications-badge');
    expect(badge).toBeTruthy();
  });
});
