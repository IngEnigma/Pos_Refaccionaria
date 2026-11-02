import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ClientSelectorModalComponent } from './client-selector-modal.component';
import { ClientsFacade } from '@features/clients/application/facades/clients.facade';
import { Client } from '@features/clients/domain/entities/client.entity';

describe('ClientSelectorModalComponent', () => {
  let fixture: ComponentFixture<ClientSelectorModalComponent>;
  let component: ClientSelectorModalComponent;

  const clientsSignal = signal<Client[]>([]);
  const loadingSignal = signal(false);
  const errorMessageSignal = signal<string | null>(null);
  const loadClients = jest.fn();

  const facadeStub = {
    clients: clientsSignal.asReadonly(),
    loading: loadingSignal.asReadonly(),
    errorMessage: errorMessageSignal.asReadonly(),
    loadClients,
  };

  const makeClient = (overrides: Partial<Client> = {}): Client => ({
    id: 25,
    idSucursal: 3,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    telefono: '5512345678',
    correo: null,
    direccion: null,
    rfc: null,
    ...overrides,
  });

  const clients: Client[] = [
    makeClient({ id: 25, nombre: 'Juan', apellidoPaterno: 'Pérez', apellidoMaterno: 'López', telefono: '5512345678' }),
    makeClient({ id: 30, nombre: 'María', apellidoPaterno: 'Gómez', apellidoMaterno: null, telefono: '5598765432' }),
    makeClient({ id: 35, nombre: 'Carlos', apellidoPaterno: 'Hernández', apellidoMaterno: 'Ruiz', telefono: '5555550000' }),
  ];

  beforeEach(() => {
    clientsSignal.set(clients);
    loadingSignal.set(false);
    errorMessageSignal.set(null);
    loadClients.mockClear();

    TestBed.configureTestingModule({
      providers: [{ provide: ClientsFacade, useValue: facadeStub }],
    });

    fixture = TestBed.createComponent(ClientSelectorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.client-option') as NodeListOf<HTMLButtonElement>,
    );
  }

  function optionByText(text: string): HTMLButtonElement {
    const found = optionButtons().find((b) => b.textContent?.includes(text));
    if (!found) throw new Error(`Opción no encontrada: ${text}`);
    return found;
  }

  function setSearch(value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.search-input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  // Verifica que al montarse el modal se pida el catálogo de clientes real.
  it('carga el catálogo de clientes al crearse', () => {
    expect(loadClients).toHaveBeenCalledTimes(1);
  });

  // Verifica que la lista muestre el nombre completo y teléfono de cada cliente.
  it('muestra el listado de clientes con nombre y teléfono', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Juan Pérez López');
    expect(text).toContain('5512345678');
    expect(text).toContain('María Gómez');
    expect(text).toContain('Carlos Hernández Ruiz');
  });

  // Verifica que la opción Público general siempre esté disponible y emita null.
  it('seleccionar Público general emite select con null', () => {
    let emitted: Client | null | undefined = undefined;
    component.select.subscribe((value) => (emitted = value));

    optionByText('Público general').click();

    expect(emitted).toBeNull();
  });

  // Verifica que al seleccionar un cliente se emita ese cliente.
  it('seleccionar un cliente emite select con el cliente elegido', () => {
    let emitted: Client | null | undefined = undefined;
    component.select.subscribe((value) => (emitted = value));

    optionByText('María Gómez').click();

    expect(emitted?.id).toBe(30);
    expect(emitted?.nombre).toBe('María');
  });

  // Verifica resaltado del cliente actualmente seleccionado.
  it('resalta el cliente actualmente seleccionado', () => {
    fixture.componentRef.setInput('selectedClient', clients[1]);
    fixture.detectChanges();

    const selected = optionButtons().filter((b) => b.classList.contains('selected'));
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('María Gómez');
  });

  // Verifica búsqueda por nombre sin distinguir mayúsculas/minúsculas y con espacios.
  it('busca por nombre sin distinguir mayúsculas y con trim', () => {
    setSearch('  jUaN  ');
    const visible = optionButtons().filter((b) => !b.classList.contains('public-option'));
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('Juan Pérez López');
  });

  // Verifica búsqueda por apellido paterno.
  it('busca por apellido paterno', () => {
    setSearch('gómez');
    const visible = optionButtons().filter((b) => !b.classList.contains('public-option'));
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('María Gómez');
  });

  // Verifica búsqueda por apellido materno.
  it('busca por apellido materno', () => {
    setSearch('ruiz');
    const visible = optionButtons().filter((b) => !b.classList.contains('public-option'));
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('Carlos Hernández Ruiz');
  });

  // Verifica búsqueda por teléfono.
  it('busca por teléfono', () => {
    setSearch('5598765432');
    const visible = optionButtons().filter((b) => !b.classList.contains('public-option'));
    expect(visible).toHaveLength(1);
    expect(visible[0].textContent).toContain('María Gómez');
  });

  // Verifica que sin coincidencias se muestre el mensaje correspondiente.
  it('muestra mensaje cuando no hay coincidencias', () => {
    setSearch('zzzznoexiste');
    expect(fixture.nativeElement.textContent).toContain('No se encontraron coincidencias.');
    const visible = optionButtons().filter((b) => !b.classList.contains('public-option'));
    expect(visible).toHaveLength(0);
  });

  // Verifica el estado de carga del catálogo.
  it('muestra estado de carga mientras se consultan los clientes', () => {
    loadingSignal.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando clientes...');
  });

  // Verifica el estado de error al obtener el catálogo.
  it('muestra mensaje de error si falla la carga del catálogo', () => {
    errorMessageSignal.set('No fue posible cargar los clientes.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar los clientes.');
  });

  // Verifica que Cancelar emita close sin emitir selección.
  it('cerrar con Cancelar emite close y no emite select', () => {
    let closed = false;
    let selected = false;
    component.close.subscribe(() => (closed = true));
    component.select.subscribe(() => (selected = true));

    const cancel = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((b) => b.textContent?.includes('Cancelar'));
    cancel?.click();

    expect(closed).toBe(true);
    expect(selected).toBe(false);
  });

  // Verifica que el backdrop cierre el modal sin modificar la selección.
  it('cerrar con backdrop emite close sin emitir select', () => {
    let closed = false;
    let selected = false;
    component.close.subscribe(() => (closed = true));
    component.select.subscribe(() => (selected = true));

    const backdrop: HTMLElement = fixture.nativeElement.querySelector('.modal-backdrop');
    backdrop.click();

    expect(closed).toBe(true);
    expect(selected).toBe(false);
  });

  // Verifica que el clic dentro del contenido NO cierre el modal (evita cierre accidental).
  it('el clic dentro del contenido no cierra el modal', () => {
    let closed = false;
    component.close.subscribe(() => (closed = true));

    const content: HTMLElement = fixture.nativeElement.querySelector('.modal-content');
    content.click();

    expect(closed).toBe(false);
  });
});
