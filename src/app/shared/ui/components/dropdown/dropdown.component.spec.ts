import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { OverlayContainer, OverlayModule } from '@angular/cdk/overlay';
import { DropdownComponent } from './dropdown.component';
import { DropdownTriggerDirective } from './dropdown-trigger.directive';
import { DropdownMenuComponent } from './dropdown-menu.component';

@Component({
  standalone: true,
  imports: [DropdownComponent, DropdownTriggerDirective, DropdownMenuComponent],
  template: `
    <app-dropdown>
      <button type="button" appDropdownTrigger>Acciones</button>
      <app-dropdown-menu>
        <button type="button">Primero</button>
        <button type="button">Segundo</button>
      </app-dropdown-menu>
    </app-dropdown>
  `,
})
class DropdownHostComponent {}

describe('DropdownComponent', () => {
  let fixture: ComponentFixture<DropdownHostComponent>;
  let overlayContainer: OverlayContainer;

  const getTrigger = (): HTMLButtonElement => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const trigger = buttons.find((btn) => btn.textContent?.trim() === 'Acciones');
    if (!trigger) {
      throw new Error('Trigger no encontrado');
    }
    return trigger;
  };

  const getOverlayContainer = (): HTMLElement =>
    overlayContainer.getContainerElement();

  const getMenu = (): HTMLElement | null =>
    getOverlayContainer().querySelector('[role="menu"]');

  const getMenuButtons = (): HTMLButtonElement[] =>
    Array.from(getOverlayContainer().querySelectorAll('[role="menu"] button')) as HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropdownHostComponent, OverlayModule],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(DropdownHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it('debería exponer aria atributos en el trigger', () => {
    const trigger = getTrigger();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toContain('app-dropdown-menu-');
  });

  it('debería actualizar aria-expanded y aria-controls al abrir', fakeAsync(() => {
    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();
    flushMicrotasks();
    tick();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const controlsId = trigger.getAttribute('aria-controls') as string;
    const menu = getOverlayContainer().querySelector(`#${controlsId}[role="menu"]`);
    expect(menu).toBeTruthy();
  }));

  it('debería enfocar el primer item al abrir', fakeAsync(() => {
    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();
    flushMicrotasks();
    tick();

    const overlayButtons = getMenuButtons();
    expect(overlayButtons.length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(overlayButtons[0]);
  }));

  it('debería cerrar con Escape aunque el foco esté en el overlay', fakeAsync(() => {
    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();
    flushMicrotasks();
    tick();

    const overlayButtons = getMenuButtons();
    overlayButtons[0]?.focus();
    expect(document.activeElement).toBe(overlayButtons[0]);

    const overlayPane = getOverlayContainer().querySelector('.cdk-overlay-pane') as HTMLElement;
    overlayPane.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    tick();

    expect(getMenu()).toBeNull();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  }));

  it('debería alternar con Enter y Space desde el trigger', fakeAsync(() => {
    const trigger = getTrigger();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    flushMicrotasks();
    tick();
    expect(getMenu()).toBeTruthy();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();
    tick();
    expect(getMenu()).toBeNull();
  }));

  it('debería limpiar el overlay al destruir', fakeAsync(() => {
    const trigger = getTrigger();
    trigger.click();
    fixture.detectChanges();
    flushMicrotasks();
    tick();

    expect(getMenu()).toBeTruthy();

    fixture.destroy();
    expect(getMenu()).toBeNull();
  }));
});
