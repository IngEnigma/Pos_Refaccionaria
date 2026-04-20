import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';
import { LucideAngularModule, House } from 'lucide-angular';
import { SidebarNavItem } from '@shell/models/sidebar-nav-item.model';

import { SidebarComponent } from './sidebar.component';

@Component({
  standalone: true,
  template: '<p>Ruta de prueba</p>',
})
class DummyRouteComponent {}

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let router: Router;

  const navItems: readonly SidebarNavItem[] = [
    { id: 'sales', label: 'Ventas', icon: 'house', route: '/sales' },
    { id: 'inventory', label: 'Inventario', icon: 'house', route: '/inventory', exact: true },
    { id: 'admin', label: 'Administración', icon: 'house', route: '/admin', disabled: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        LucideAngularModule.pick({ House })
      ],
      providers: [
        provideRouter([
          { path: 'sales', component: DummyRouteComponent },
          { path: 'inventory', component: DummyRouteComponent },
          { path: 'admin', component: DummyRouteComponent },
        ]),
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    router = TestBed.inject(Router);
    router.initialNavigation();

    fixture.componentRef.setInput('navItems', navItems);
    fixture.detectChanges();
  });

  it('renderiza los navItems recibidos', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.link-text'),
    ).map((element) => element.textContent?.trim());

    expect(labels).toEqual(['Ventas', 'Inventario', 'Administración']);
  });

  it('respeta routerLink para items habilitados', () => {
    const routerLinks = fixture.debugElement
      .queryAll(By.directive(RouterLink))
      .map((debugElement) => debugElement.injector.get(RouterLink));

    const serializedLinks = routerLinks.map((link) =>
      router.serializeUrl(link.urlTree),
    );

    expect(serializedLinks).toEqual(['/sales', '/inventory']);
  });

  it('navega al hacer click en un item habilitado', fakeAsync(() => {
    const inventoryLink = Array.from(
      fixture.nativeElement.querySelectorAll('a.sidebar-link'),
    ).find((anchor) => anchor.textContent?.includes('Inventario')) as
      | HTMLAnchorElement
      | undefined;

    expect(inventoryLink).toBeTruthy();
    inventoryLink?.click();
    tick();

    expect(router.url).toBe('/inventory');
  }));

  it('maneja items disabled sin enlace clickeable', () => {
    const disabledAnchor = Array.from(
      fixture.nativeElement.querySelectorAll('a.sidebar-link'),
    ).find((anchor) => anchor.textContent?.includes('Administración'));
    const disabledSpan = Array.from(
      fixture.nativeElement.querySelectorAll('span.sidebar-link-disabled'),
    ).find((span) => span.textContent?.includes('Administración')) as
      | HTMLSpanElement
      | undefined;

    expect(disabledAnchor).toBeUndefined();
    expect(disabledSpan).toBeTruthy();
    expect(disabledSpan?.getAttribute('aria-disabled')).toBe('true');
    expect(disabledSpan?.getAttribute('tabindex')).toBe('-1');
  });

  it('expone accesibilidad básica en la navegación', () => {
    const aside = fixture.nativeElement.querySelector('aside.sidebar') as HTMLElement;
    const nav = fixture.nativeElement.querySelector('nav.sidebar-nav') as HTMLElement;

    expect(aside.getAttribute('aria-label')).toBe('Navegación principal');
    expect(nav).toBeTruthy();
  });
});
