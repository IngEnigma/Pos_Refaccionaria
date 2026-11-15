import { TestBed } from '@angular/core/testing';
import { DESKTOP_PORT } from './desktop.port';

describe('DESKTOP_PORT', () => {
  const w = window as unknown as { desktop?: unknown };

  afterEach(() => {
    delete w.desktop;
  });

  // Verifica que en navegador (sin Electron) el puerto sea null.
  it('es null cuando no hay window.desktop (modo web)', () => {
    expect(TestBed.inject(DESKTOP_PORT)).toBeNull();
  });

  // Verifica que en Electron el puerto sea el puente expuesto por preload.
  it('resuelve window.desktop cuando existe (Electron)', () => {
    const bridge = { generateTicket: jest.fn() };
    w.desktop = bridge;

    expect(TestBed.inject(DESKTOP_PORT)).toBe(bridge);
  });
});
