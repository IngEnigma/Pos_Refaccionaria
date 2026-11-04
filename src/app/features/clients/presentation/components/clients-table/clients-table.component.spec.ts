import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Pencil, Trash2, Users } from 'lucide-angular';

import { ClientsTableComponent } from './clients-table.component';
import { Client } from '@features/clients/domain/entities/client.entity';

// Unitario: lógica de presentación de la tabla de clientes (nombre completo, estados y emits).
describe('ClientsTableComponent', () => {
  let fixture: ComponentFixture<ClientsTableComponent>;
  let component: ClientsTableComponent;

  const makeClient = (overrides: Partial<Client> = {}): Client => ({
    id: 25,
    idSucursal: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    telefono: '2711234567',
    correo: null,
    direccion: null,
    rfc: null,
    ...overrides,
  });

  function setup(clients: Client[], loading = false): void {
    fixture = TestBed.createComponent(ClientsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('clients', clients);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Iconos lucide del template (acciones y estado vacío); sin ellos el render lanza error.
        importProvidersFrom(LucideAngularModule.pick({ Pencil, Trash2, Users })),
      ],
    });
  });

  // Comprueba que getFullName concatene apellidos y solo agregue el materno si existe.
  it('getFullName une nombre y apellidos, incluyendo el materno opcional', () => {
    setup([makeClient()]);

    expect(component.getFullName(makeClient())).toBe('Juan Pérez López');
    expect(component.getFullName(makeClient({ apellidoMaterno: null }))).toBe('Juan Pérez');
    // Un materno vacío también se omite al formar el nombre.
    expect(component.getFullName(makeClient({ apellidoMaterno: '' }))).toBe('Juan Pérez');
  });

  // Comprueba que en estado de carga se muestren los skeletons y no las filas de datos.
  it('con loading muestra skeletons y sin filas de datos', () => {
    setup([], true);

    const rows = fixture.nativeElement.querySelectorAll('.client-row');
    const skeletons = fixture.nativeElement.querySelectorAll('app-skeleton');
    expect(rows).toHaveLength(0);
    // 5 filas de skeleton x 5 celdas (nombre, teléfono, correo, RFC, acciones).
    expect(skeletons).toHaveLength(25);
  });

  // Comprueba que cada fila muestre el nombre completo, el teléfono y la inicial en el avatar.
  it('renderiza cada cliente con nombre completo, teléfono y avatar', () => {
    setup([makeClient()]);

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Juan Pérez López');
    expect(text).toContain('2711234567');
    expect(text).toContain('J'); // inicial del avatar
    expect(fixture.nativeElement.querySelectorAll('.client-row')).toHaveLength(1);
  });

  // Comprueba que sin correo ni RFC la tabla muestre el guion en lugar de celdas vacías.
  it('muestra guion cuando el cliente no tiene correo ni RFC', () => {
    setup([makeClient({ correo: null, rfc: null })]);

    const muted = fixture.nativeElement.querySelectorAll('.text-muted');
    expect(muted).toHaveLength(2);
    expect(muted[0].textContent?.trim()).toBe('—');
    expect(muted[1].textContent?.trim()).toBe('—');
  });

  // Comprueba que con correo y RFC presentes se rendericen el enlace mailto y la insignia.
  it('muestra enlace mailto y badge de RFC cuando existen', () => {
    setup([makeClient({ correo: 'juan@ejemplo.com', rfc: 'PEJU800101' })]);

    const link = fixture.nativeElement.querySelector('.mail-link') as HTMLAnchorElement;
    const badge = fixture.nativeElement.querySelector('.rfc-badge');
    expect(link.getAttribute('href')).toBe('mailto:juan@ejemplo.com');
    expect(link.textContent).toBe('juan@ejemplo.com');
    expect(badge?.textContent).toBe('PEJU800101');
  });

  // Comprueba que la lista vacía sin carga muestre el mensaje de estado vacío.
  it('sin clientes muestra el estado vacío', () => {
    setup([]);

    expect(fixture.nativeElement.textContent).toContain(
      'No se encontraron clientes registrados.',
    );
  });

  // Comprueba que el botón de editar emita el cliente de la fila.
  it('el botón de editar emite el cliente', () => {
    const client = makeClient();
    setup([client]);

    let emitted: Client | undefined;
    component.edit.subscribe((c) => (emitted = c));
    (fixture.nativeElement.querySelector('.btn-action.edit') as HTMLButtonElement).click();

    expect(emitted).toEqual(client);
  });

  // Comprueba que el botón de eliminar emita el cliente de la fila.
  it('el botón de eliminar emite el cliente', () => {
    const client = makeClient();
    setup([client]);

    let emitted: Client | undefined;
    component.delete.subscribe((c) => (emitted = c));
    (fixture.nativeElement.querySelector('.btn-action.delete') as HTMLButtonElement).click();

    expect(emitted).toEqual(client);
  });
});
