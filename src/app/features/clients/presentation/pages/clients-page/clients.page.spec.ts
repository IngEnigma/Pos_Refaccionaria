import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, importProvidersFrom } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { LucideAngularModule, Plus, Pencil, Trash2, Users } from 'lucide-angular';

import { ClientsPageComponent } from './clients.page';
import { ClientsFacade } from '../../../application/facades/clients.facade';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { Client } from '../../../domain/entities/client.entity';

// Unitario: lógica propia de la página de clientes (carga inicial, alta, edición,
// eliminación y toast de error) con fachadas sustituidas por stubs.
describe('ClientsPageComponent', () => {
  let fixture: ComponentFixture<ClientsPageComponent>;
  let component: ClientsPageComponent;

  let clientsSignal: ReturnType<typeof signal<readonly Client[]>>;
  let loadingSignal: ReturnType<typeof signal<boolean>>;
  let errorSignal: ReturnType<typeof signal<string | null>>;
  let sucursalSignal: ReturnType<typeof signal<number | null>>;
  let loadClients: jest.Mock;
  let createClient: jest.Mock;
  let updateClient: jest.Mock;
  let deleteClient: jest.Mock;
  let toastError: jest.Mock;
  let toastSuccess: jest.Mock;
  let dialogOpen: jest.SpyInstance;

  const makeClient = (id = 25): Client => ({
    id,
    idSucursal: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: null,
    telefono: '2711234567',
    correo: null,
    direccion: null,
    rfc: null,
  });

  beforeEach(() => {
    clientsSignal = signal<readonly Client[]>([]);
    loadingSignal = signal(false);
    errorSignal = signal<string | null>(null);
    sucursalSignal = signal<number | null>(1);
    loadClients = jest.fn();
    createClient = jest.fn(() => of(makeClient(40)));
    updateClient = jest.fn(() => of(makeClient()));
    deleteClient = jest.fn(() => of(void 0));
    toastError = jest.fn();
    toastSuccess = jest.fn();
    // El DialogModule del template provee un Dialog real que pisa al stub del TestBed;
    // se usa un spy de prototipo para interceptar dialog.open sin alterar la página.
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');

    TestBed.configureTestingModule({
      providers: [
        // Iconos lucide del template (botón Registrar y acciones de la tabla).
        importProvidersFrom(LucideAngularModule.pick({ Plus, Pencil, Trash2, Users })),
        { provide: AuthFacade, useValue: { sucursalId: sucursalSignal.asReadonly() } },
        {
          provide: ClientsFacade,
          useValue: {
            clients: clientsSignal.asReadonly(),
            loading: loadingSignal.asReadonly(),
            errorMessage: errorSignal.asReadonly(),
            loadClients,
            createClient,
            updateClient,
            deleteClient,
          },
        },
        { provide: ToastService, useValue: { error: toastError, success: toastSuccess } },
      ],
    });

    fixture = TestBed.createComponent(ClientsPageComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    dialogOpen.mockRestore();
  });

  // Cambia la señal de error y fuerza el flush de los efectos de la página.
  function flushError(message: string | null): void {
    errorSignal.set(message);
    TestBed.flushEffects();
  }

  // Comprueba que al iniciar la página se solicite el catálogo de clientes.
  it('ngOnInit carga el catálogo de clientes', () => {
    fixture.detectChanges(); // dispara ngOnInit

    expect(loadClients).toHaveBeenCalledTimes(1);
  });

  // Comprueba que sin error en la fachada no se muestre ningún toast de error.
  it('sin errorMessage no muestra toast de error', () => {
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(toastError).not.toHaveBeenCalled();
  });

  // Comprueba que cuando la fachada reporta un error se muestre como toast de error.
  it('muestra toast de error cuando la fachada reporta fallo', () => {
    fixture.detectChanges();

    flushError('No fue posible cargar los clientes.');

    expect(toastError).toHaveBeenCalledWith('No fue posible cargar los clientes.');
  });

  // Comprueba que al confirmar el alta se cree el cliente, se avise y se recargue el catálogo.
  it('confirmar alta crea el cliente, avisa y recarga', () => {
    fixture.detectChanges();
    loadClients.mockClear(); // aisla la llamada de la recarga posterior
    const payload = { nombre: 'María', telefono: '2719876543' };
    dialogOpen.mockReturnValue({ closed: of(payload) } as never);

    component.onAddClient();

    expect(dialogOpen).toHaveBeenCalled();
    expect(createClient).toHaveBeenCalledWith(payload);
    expect(toastSuccess).toHaveBeenCalledWith('Cliente registrado correctamente');
    expect(loadClients).toHaveBeenCalledTimes(1);
  });

  // Comprueba que el diálogo de alta reciba la sucursal del usuario autenticado.
  it('el diálogo de alta recibe la sucursal actual', () => {
    fixture.detectChanges();
    dialogOpen.mockReturnValue({ closed: of(null) } as never);

    component.onAddClient();

    const dialogData = dialogOpen.mock.calls[0][1] as { data: { sucursalId: number | null } };
    expect(dialogData.data.sucursalId).toBe(1);
  });

  // Comprueba que cancelar el alta no invoque createClient.
  it('cancelar el alta no crea nada', () => {
    fixture.detectChanges();
    dialogOpen.mockReturnValue({ closed: of(null) } as never);

    component.onAddClient();

    expect(createClient).not.toHaveBeenCalled();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  // Comprueba que al confirmar la edición se actualice el cliente por su id y se recargue.
  it('confirmar edición actualiza por id, avisa y recarga', () => {
    fixture.detectChanges();
    loadClients.mockClear();
    const payload = { nombre: 'Juan Carlos' };
    dialogOpen.mockReturnValue({ closed: of(payload) } as never);

    component.onEditClient(makeClient(25));

    expect(updateClient).toHaveBeenCalledWith(25, payload);
    expect(toastSuccess).toHaveBeenCalledWith('Cliente actualizado correctamente');
    expect(loadClients).toHaveBeenCalledTimes(1);
  });

  // Comprueba que el diálogo de edición reciba el cliente seleccionado.
  it('el diálogo de edición recibe el cliente a modificar', () => {
    fixture.detectChanges();
    const client = makeClient(25);
    dialogOpen.mockReturnValue({ closed: of(null) } as never);

    component.onEditClient(client);

    const dialogData = dialogOpen.mock.calls[0][1] as { data: { client: Client } };
    expect(dialogData.data.client).toEqual(client);
  });

  // Comprueba que cancelar la edición no invoque updateClient.
  it('cancelar la edición no actualiza nada', () => {
    fixture.detectChanges();
    dialogOpen.mockReturnValue({ closed: of(null) } as never);

    component.onEditClient(makeClient(25));

    expect(updateClient).not.toHaveBeenCalled();
  });

  // Comprueba que al confirmar la eliminación se borre el cliente, se avise y se recargue.
  it('confirmar eliminación borra por id, avisa y recarga', () => {
    fixture.detectChanges();
    loadClients.mockClear();
    dialogOpen.mockReturnValue({ closed: of(true) } as never);

    component.onDeleteClient(makeClient(25));

    expect(deleteClient).toHaveBeenCalledWith(25);
    expect(toastSuccess).toHaveBeenCalledWith('Cliente eliminado correctamente');
    expect(loadClients).toHaveBeenCalledTimes(1);
  });

  // Comprueba que el diálogo de confirmación nombre al cliente que se va a eliminar.
  it('la confirmación de eliminación muestra el nombre del cliente', () => {
    fixture.detectChanges();
    dialogOpen.mockReturnValue({ closed: of(false) } as never);

    component.onDeleteClient(makeClient(25));

    const dialogData = dialogOpen.mock.calls[0][1] as { data: { message: string; title: string } };
    expect(dialogData.data.title).toBe('Eliminar Cliente');
    expect(dialogData.data.message).toContain('Juan Pérez');
  });

  // Comprueba que cancelar la eliminación no invoque deleteClient.
  it('cancelar la eliminación no borra nada', () => {
    fixture.detectChanges();
    dialogOpen.mockReturnValue({ closed: of(false) } as never);

    component.onDeleteClient(makeClient(25));

    expect(deleteClient).not.toHaveBeenCalled();
  });
});
