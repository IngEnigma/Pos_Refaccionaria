import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketModalComponent } from './ticket-modal.component';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';

// Funcional: modal de ticket real + ToastService real. Sin dobles de colaboradores.
describe('TicketModalComponent (funcional)', () => {
  let fixture: ComponentFixture<TicketModalComponent>;
  let component: TicketModalComponent;
  let toasts: ToastService;

  const ticket = new SaleTicket({
    folio: 50,
    fecha: '2024-01-01T00:00:00Z',
    vendedor: 'vendedora',
    metodoPago: 'EFECTIVO',
    sucursal: 'Central',
    productos: [{ nombre: 'Filtro de aceite', cantidad: 2, precioUnitario: '120.00', subtotal: '240.00' }],
    total: '278.40',
  });

  beforeAll(() => {
    // Shim de entorno: jsdom no expone crypto.randomUUID y ToastService lo requiere.
    const g = globalThis as Record<string, unknown>;
    if (!g['crypto']) g['crypto'] = {};
    const c = g['crypto'] as Record<string, unknown>;
    if (typeof c['randomUUID'] !== 'function') c['randomUUID'] = () => `uuid-${Math.random()}`;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    toasts = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(TicketModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ticket', ticket);
    fixture.detectChanges();
  });

  // Verifica que el modal muestre folio, líneas del ticket y total al usuario.
  it('muestra folio, productos y total del ticket', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ticket #50');
    expect(text).toContain('Filtro de aceite');
    expect(text).toContain('2x');
    expect(text).toContain('278.40');
  });

  // Verifica que el botón Cerrar emita el cierre del modal.
  it('el botón Cerrar emite el cierre', () => {
    let closed = 0;
    component.close.subscribe(() => closed++);

    (fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement).click();

    expect(closed).toBe(1);
  });

  // Verifica que pulsar el fondo (backdrop) cierre, pero pulsar el contenido no.
  it('el fondo cierra y el contenido no', () => {
    let closed = 0;
    component.close.subscribe(() => closed++);

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closed).toBe(1);

    const content = fixture.nativeElement.querySelector('.modal-content') as HTMLElement;
    content.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(closed).toBe(1);
  });

  // Verifica que reimprimir en modo web (sin puente desktop) avise con toast y libere el botón.
  it('reimprimir en modo web avisa y libera el botón', async () => {
    await component.onReprint();
    fixture.detectChanges();

    const all = toasts.toasts();
    expect(all[all.length - 1].type).toBe('success');
    expect(component.isReprinting()).toBe(false);
    expect((fixture.nativeElement.querySelector('.btn-primary') as HTMLButtonElement).disabled).toBe(false);
  });
});
