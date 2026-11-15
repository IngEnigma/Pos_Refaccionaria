import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketModalComponent } from './ticket-modal.component';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { toTicketPrintPayload } from '@features/sales/application/mappers/ticket-print-payload.mapper';
import { DESKTOP_PORT, DesktopPort } from '@core/ports/desktop.port';

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
    subtotal: '240.00',
    iva: '38.40',
    total: '278.40',
  });

  beforeAll(() => {
    // Shim de entorno: jsdom no expone crypto.randomUUID y ToastService lo requiere.
    const g = globalThis as Record<string, unknown>;
    if (!g['crypto']) g['crypto'] = {};
    const c = g['crypto'] as Record<string, unknown>;
    if (typeof c['randomUUID'] !== 'function') c['randomUUID'] = () => `uuid-${Math.random()}`;
  });

  // H-10/H-40: el modal usa el puerto de escritorio inyectable (null = modo web).
  const mount = (port: DesktopPort | null) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ToastService, { provide: DESKTOP_PORT, useValue: port }],
    });
    toasts = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(TicketModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ticket', ticket);
    fixture.detectChanges();
  };

  beforeEach(() => mount(null));

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

  // El desglose viene del backend (subtotal + IVA = total).
  it('muestra el subtotal y el IVA que manda el backend', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toMatch(/Subtotal:\s*(MX)?\$240\.00/);
    expect(text).toMatch(/IVA 16%:\s*(MX)?\$38\.40/);
  });

  // H-17: el modo web no debe filtrar el payload del ticket a la consola.
  it('reimprimir en modo web no escribe en consola', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation();

    await component.onReprint();

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  describe('reimpresión con puente de escritorio', () => {
    const generateTicket = jest.fn();
    const lastToast = () => toasts.toasts()[toasts.toasts().length - 1];

    beforeEach(() => {
      generateTicket.mockReset();
      mount({ generateTicket });
    });

    // Verifica que se envíe el payload del mapper compartido con sales.page y se avise éxito.
    it('envía el payload del mapper y avisa éxito', async () => {
      generateTicket.mockResolvedValue({ success: true });

      await component.onReprint();

      expect(generateTicket).toHaveBeenCalledWith(toTicketPrintPayload(ticket));
      expect(lastToast()).toMatchObject({ type: 'success', message: 'Ticket reimpreso correctamente.' });
      expect(component.isReprinting()).toBe(false);
    });

    // Verifica que un fallo reportado por la impresora muestre su mensaje.
    it('muestra el mensaje de la impresora si success es false', async () => {
      generateTicket.mockResolvedValue({ success: false, message: 'Sin papel' });

      await component.onReprint();

      expect(lastToast()).toMatchObject({ type: 'error', message: 'Sin papel' });
    });

    // Verifica el mensaje por defecto cuando la impresora falla sin mensaje.
    it('usa mensaje por defecto si success es false sin mensaje', async () => {
      generateTicket.mockResolvedValue({ success: false });

      await component.onReprint();

      expect(lastToast()).toMatchObject({ type: 'error', message: 'No fue posible reimprimir el ticket.' });
    });

    // Verifica que un rechazo con Error muestre su mensaje y libere el botón.
    it('un rechazo con Error muestra su mensaje y libera el botón', async () => {
      generateTicket.mockRejectedValue(new Error('IPC caído'));

      await component.onReprint();

      expect(lastToast()).toMatchObject({ type: 'error', message: 'IPC caído' });
      expect(component.isReprinting()).toBe(false);
    });

    // Verifica el mensaje por defecto cuando el rechazo no es un Error.
    it('un rechazo que no es Error usa el mensaje por defecto', async () => {
      generateTicket.mockRejectedValue('boom');

      await component.onReprint();

      expect(lastToast()).toMatchObject({ type: 'error', message: 'Error al reimprimir ticket' });
    });

    // Verifica que un segundo clic en vuelo no dispare otra impresión.
    it('ignora un segundo clic mientras reimprime', async () => {
      let release!: (v: { success: boolean }) => void;
      generateTicket.mockReturnValue(new Promise((r) => (release = r)));

      const first = component.onReprint();
      await component.onReprint();
      release({ success: true });
      await first;

      expect(generateTicket).toHaveBeenCalledTimes(1);
    });
  });

  // Verifica que los datos opcionales nulos (sucursal, fecha, vendedor, pago) no se rendericen.
  it('oculta sucursal, fecha, vendedor y pago cuando son nulos', () => {
    fixture.componentRef.setInput(
      'ticket',
      new SaleTicket({ folio: 7, fecha: null, vendedor: null, metodoPago: null, sucursal: null, productos: [], subtotal: '0.00', iva: '0.00', total: '0.00' }),
    );
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ticket #7');
    expect(text).not.toContain('Fecha:');
    expect(text).not.toContain('Vendedor:');
    expect(text).not.toContain('Pago:');
    expect(fixture.nativeElement.querySelector('.ticket-branch')).toBeNull();
  });

  // Verifica que el botón ✕ del encabezado también cierre el modal.
  it('el botón ✕ emite el cierre', () => {
    let closed = 0;
    component.close.subscribe(() => closed++);

    (fixture.nativeElement.querySelector('.btn-close') as HTMLButtonElement).click();

    expect(closed).toBe(1);
  });
});
