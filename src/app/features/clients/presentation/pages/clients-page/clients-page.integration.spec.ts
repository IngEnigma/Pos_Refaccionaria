import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal, importProvidersFrom } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import {
  LucideAngularModule,
  Plus,
  Pencil,
  Trash2,
  Users,
  Edit,
  PlusCircle,
  X,
  User,
  Phone,
  FileText,
  Hash,
  MapPin,
  Check,
  Save,
} from 'lucide-angular';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { ClientsPageComponent } from './clients.page';
import { ClientFormDialogComponent, ClientFormDialogData } from '../../components/client-form-dialog/client-form-dialog.component';
import { ClientsFacade } from '../../../application/facades/clients.facade';
import { GetClientsUseCase } from '../../../application/usecase/get-clients.usecase';
import { CreateClientUseCase } from '../../../application/usecase/create-client.usecase';
import { UpdateClientUseCase } from '../../../application/usecase/update-client.usecase';
import { DeleteClientUseCase } from '../../../application/usecase/delete-client.usecase';
import { ClientRepository } from '../../../domain/repository/client-repository';
import { ClientRepositoryImpl } from '../../../infrastructure/repositories/client-repository.impl';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { ToastService } from '@shared/ui/components/toast/toast.service';

// Integración real de punta a punta del frontend (sin backend real):
// Página -> Tabla -> Diálogos -> ClientsFacade -> UseCases -> Repositorio -> HttpClient -> Mapper.
// Únicos bordes simulados: el transporte HTTP (HttpTestingController), el Dialog de CDK
// (spy de prototipo) y sucursalId del AuthFacade (una señal).
describe('ClientsPageComponent (integración)', () => {
  const API = environment.apiUrl;
  const CLIENTES = `${API}/clientes`;

  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<ClientsPageComponent>;
  let page: ClientsPageComponent;
  let toastService: ToastService;
  let dialogOpen: jest.SpyInstance;
  let dialogRefClose: jest.Mock;
  let dialogData: ClientFormDialogData;

  const dto = (overrides = {}) => ({
    id: 25,
    id_sucursal: 1,
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López',
    telefono: '2711234567',
    correo: 'juan@ejemplo.com',
    direccion: null,
    rfc: null,
    ...overrides,
  });

  beforeAll(() => {
    // Shim de entorno: jsdom no expone crypto.randomUUID (lo requiere ToastService real).
    const g = globalThis as Record<string, unknown>;
    if (!g['crypto']) g['crypto'] = {};
    const c = g['crypto'] as Record<string, unknown>;
    if (typeof c['randomUUID'] !== 'function') {
      c['randomUUID'] = () => `uuid-${Math.random()}`;
    }
  });

  beforeEach(() => {
    dialogRefClose = jest.fn();
    dialogData = { sucursalId: 1 };
    // El DialogModule del template provee un Dialog real que pisa al stub del TestBed;
    // se usa un spy de prototipo para interceptar dialog.open sin alterar la página.
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        // Cadena real del módulo de clientes.
        ClientsFacade,
        GetClientsUseCase,
        CreateClientUseCase,
        UpdateClientUseCase,
        DeleteClientUseCase,
        { provide: ClientRepository, useClass: ClientRepositoryImpl },
        // Fronteras simuladas: sucursal del usuario y diálogos de CDK.
        { provide: AuthFacade, useValue: { sucursalId: signal<number | null>(1).asReadonly() } },
        { provide: DIALOG_DATA, useValue: dialogData },
        { provide: DialogRef, useValue: { close: dialogRefClose } },
        // Iconos lucide de página, tabla y formulario; sin ellos el render lanza error.
        importProvidersFrom(
          LucideAngularModule.pick({
            Plus,
            Pencil,
            Trash2,
            Users,
            Edit,
            PlusCircle,
            X,
            User,
            Phone,
            FileText,
            Hash,
            MapPin,
            Check,
            Save,
          }),
        ),
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    toastService = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ClientsPageComponent);
    page = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
    dialogOpen.mockRestore();
  });

  // Refresca la vista y los efectos de la página (toast de errorMessage).
  function render(): void {
    fixture.detectChanges();
    TestBed.flushEffects();
  }

  // Carga inicial: detectChanges dispara ngOnInit y deja el GET pendiente.
  function startAndFlushInitial(clients: unknown[]): void {
    fixture.detectChanges();
    httpMock.expectOne(CLIENTES).flush(clients);
    render();
  }

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.client-option') as NodeListOf<HTMLButtonElement>,
    );
  }

  function toastTypes(): string[] {
    return toastService.toasts().map((t) => t.type);
  }

  // EVIDENCIA de bug: el effect de la página llama a ToastService.error, que escribe una
  // señal dentro de un effect sin allowSignalWrites -> NG0600. Angular lo captura con su
  // ErrorHandler (console.error) y el toast nunca se registra. Pendiente de revisión por
  // el encargado de frontend; el comportamiento de producción no se modifica aquí.
  function expectNg0600Evidence(errorSpy: jest.SpyInstance): void {
    const sawNg0600 = errorSpy.mock.calls.some((args) =>
      args.some((a) => String(a).includes('NG0600')),
    );
    expect(sawNg0600).toBe(true);
    expect(toastService.toasts()).toEqual([]);
  }

  // ---------- A. Carga del catálogo ----------

  // Comprueba que mientras el GET sigue pendiente la tabla muestre skeletons y,
  // al fluir la respuesta, aparezcan los nombres mapeados por el mapper del dominio.
  it('la carga HTTP atraviesa la cadena y la tabla muestra los clientes mapeados', () => {
    fixture.detectChanges(); // ngOnInit -> GET pendiente

    // Estado de carga visible en la tabla real antes de que responda el backend.
    expect(facadeLoading()).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('app-skeleton').length).toBeGreaterThan(0);

    httpMock.expectOne(CLIENTES).flush([dto()]);
    render();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Juan Pérez López');
    expect(text).toContain('2711234567');
    expect(facadeLoading()).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.client-row')).toHaveLength(1);
  });

  // Comprueba que una respuesta vacía active el estado vacío de la tabla.
  it('una respuesta vacía muestra el estado sin clientes', () => {
    startAndFlushInitial([]);

    expect(fixture.nativeElement.textContent).toContain('No se encontraron clientes registrados.');
  });

  // Comprueba que un 500 con {"message"} alcance el errorMessage de la fachada (cadena
  // HTTP -> facade íntegra) y deja constancia del BUG: el effect de la página lanza
  // NG0600 al escribir la señal de ToastService, así que el toast de error nunca aparece.
  it('EVIDENCIA: el error de carga llega a la fachada pero el toast no aparece (NG0600)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    fixture.detectChanges();

    httpMock
      .expectOne(CLIENTES)
      .flush({ message: 'Error interno del servidor.' }, { status: 500, statusText: 'Server Error' });
    render();

    // La cadena de integración sí entregó el mensaje a la fachada...
    expect(TestBed.inject(ClientsFacade).errorMessage()).toBe('Error interno del servidor.');
    // ...pero el toast nunca se registra porque el effect falla (NG0600) y no hay éxito.
    expectNg0600Evidence(errorSpy);
    expect(toastTypes()).not.toContain('success');
    expect(fixture.nativeElement.querySelectorAll('.client-row')).toHaveLength(0);
    errorSpy.mockRestore();
  });

  // ---------- B. Registro de clientes ----------

  // Comprueba el alta completa: el formulario real construye el payload, la página lo
  // delega, el POST viaja en snake_case y la recarga posterior refleja el nuevo cliente.
  it('el alta real termina en POST snake_case y el catálogo recarga con el nuevo cliente', () => {
    startAndFlushInitial([dto()]);

    // 1) El formulario REAL construye el payload (misma pieza que usa el diálogo).
    const form = TestBed.createComponent(ClientFormDialogComponent);
    form.detectChanges(); // ngOnInit inicializa clientForm
    form.componentInstance.clientForm.setValue({
      nombre: 'María',
      apellidoPaterno: 'Gómez',
      apellidoMaterno: '',
      telefono: '2719876543',
      correo: '',
      direccion: '',
      rfc: '',
    });
    form.componentInstance.onSubmit();
    const payload = dialogRefClose.mock.calls[0][0] as Record<string, unknown>;

    // 2) La página recibe ese payload desde el diálogo y dispara el alta.
    dialogOpen.mockReturnValue({ closed: of(payload) } as never);
    page.onAddClient();

    const post = httpMock.expectOne(CLIENTES);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      id_sucursal: 1,
      nombre: 'María',
      apellido_paterno: 'Gómez',
      apellido_materno: null,
      telefono: '2719876543',
      correo: null,
      direccion: null,
      rfc: null,
    });
    post.flush(dto({ id: 40, nombre: 'María', apellido_paterno: 'Gómez', apellido_materno: null }));

    // 3) El éxito dispara la recarga del catálogo.
    httpMock.expectOne(CLIENTES).flush([
      dto(),
      dto({ id: 40, nombre: 'María', apellido_paterno: 'Gómez', apellido_materno: null }),
    ]);
    render();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('María Gómez');
    expect(toastService.toasts()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'success', message: 'Cliente registrado correctamente' }),
      ]),
    );
  });

  // Comprueba que un POST fallido no muestre éxito ni recargue el catálogo, que el
  // mensaje del backend alcance la fachada, y deja constancia del BUG NG0600 que
  // impide que el toast de error se registre con el ToastService real.
  it('EVIDENCIA: un alta fallida no se muestra como exitosa ni recarga (NG0600 en el toast)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    startAndFlushInitial([dto()]);

    dialogOpen.mockReturnValue({ closed: of({ nombre: 'X', idSucursal: 1 }) } as never);
    page.onAddClient();

    httpMock
      .expectOne(CLIENTES)
      .flush({ message: 'Datos inválidos.' }, { status: 400, statusText: 'Bad Request' });
    render();

    expect(toastTypes()).not.toContain('success');
    expect(TestBed.inject(ClientsFacade).errorMessage()).toBe('Datos inválidos.');
    expectNg0600Evidence(errorSpy);
    // No se emitió una segunda petición GET: el catálogo no se recargó.
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez López');
    errorSpy.mockRestore();
  });

  // Comprueba que cancelar el diálogo de alta no genere ninguna petición HTTP.
  it('cancelar el alta no realiza peticiones HTTP', () => {
    startAndFlushInitial([dto()]);

    dialogOpen.mockReturnValue({ closed: of(null) } as never);
    page.onAddClient();

    // afterEach verifica que no queden peticiones pendientes: no hubo POST ni GET extra.
    expect(toastTypes()).not.toContain('success');
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez López');
  });

  // ---------- C. Actualización de clientes ----------

  // Comprueba el flujo de edición completo: clic en la tabla real, diálogo con el
  // cliente, payload del formulario real, PUT y recarga con el nombre actualizado.
  it('editar desde la tabla termina en PUT y la recarga muestra el nombre actualizado', () => {
    startAndFlushInitial([dto()]);

    // El formulario real (en modo edición) construye el payload.
    dialogData.client = {
      id: 25,
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: 'juan@ejemplo.com',
      direccion: null,
      rfc: null,
    };
    const form = TestBed.createComponent(ClientFormDialogComponent);
    form.detectChanges(); // ngOnInit inicializa clientForm
    form.componentInstance.clientForm.get('nombre')?.setValue('Juan Carlos');
    form.componentInstance.onSubmit();
    const payload = dialogRefClose.mock.calls[0][0] as Record<string, unknown>;
    dialogOpen.mockReturnValue({ closed: of(payload) } as never);

    // 1) Clic en el lápiz de la tabla real: la emisión llega a la página.
    (fixture.nativeElement.querySelector('.btn-action.edit') as HTMLButtonElement).click();

    const dialogCall = dialogOpen.mock.calls[0][1] as { data: { client: { id: number } } };
    expect(dialogCall.data.client.id).toBe(25);

    // 2) PUT con el payload transformado.
    const put = httpMock.expectOne(`${CLIENTES}/25`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.nombre).toBe('Juan Carlos');
    put.flush(dto({ nombre: 'Juan Carlos' }));

    // 3) Recarga y visualización del nombre nuevo.
    httpMock.expectOne(CLIENTES).flush([dto({ nombre: 'Juan Carlos' })]);
    render();

    expect(fixture.nativeElement.textContent).toContain('Juan Carlos Pérez López');
    expect(toastService.toasts()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'success', message: 'Cliente actualizado correctamente' }),
      ]),
    );
  });

  // Comprueba que un PUT fallido no recargue el catálogo ni muestre éxito (el nombre
  // original permanece) y deja constancia del BUG NG0600 en el toast de error.
  it('EVIDENCIA: una edición fallida conserva el nombre original (NG0600 en el toast)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    startAndFlushInitial([dto()]);
    dialogOpen.mockReturnValue({ closed: of({ nombre: 'Hacker' }) } as never);

    page.onEditClient({
      id: 25,
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: null,
      direccion: null,
      rfc: null,
    });

    httpMock
      .expectOne(`${CLIENTES}/25`)
      .flush({ message: 'Cliente no encontrado.' }, { status: 404, statusText: 'Not Found' });
    render();

    expect(toastTypes()).not.toContain('success');
    expect(TestBed.inject(ClientsFacade).errorMessage()).toBe('Cliente no encontrado.');
    expectNg0600Evidence(errorSpy);
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez López');
    errorSpy.mockRestore();
  });

  // ---------- D. Eliminación de clientes ----------

  // Comprueba que confirmar desde el diálogo real ejecute DELETE y que la recarga
  // deje la tabla sin el cliente eliminado.
  it('confirmar la eliminación borra vía DELETE y la recarga deja la tabla sin el cliente', () => {
    startAndFlushInitial([dto()]);
    dialogOpen.mockReturnValue({ closed: of(true) } as never);

    // Clic en el bote de la tabla real.
    (fixture.nativeElement.querySelector('.btn-action.delete') as HTMLButtonElement).click();

    const confirmData = dialogOpen.mock.calls[0][1] as { data: { message: string } };
    expect(confirmData.data.message).toContain('Juan Pérez');

    const del = httpMock.expectOne(`${CLIENTES}/25`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);

    httpMock.expectOne(CLIENTES).flush([]);
    render();

    expect(fixture.nativeElement.textContent).toContain('No se encontraron clientes registrados.');
    expect(toastService.toasts()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'success', message: 'Cliente eliminado correctamente' }),
      ]),
    );
  });

  // Comprueba que cancelar la confirmación no emita DELETE ni recargue el catálogo.
  it('cancelar la eliminación no realiza peticiones HTTP', () => {
    startAndFlushInitial([dto()]);
    dialogOpen.mockReturnValue({ closed: of(false) } as never);

    (fixture.nativeElement.querySelector('.btn-action.delete') as HTMLButtonElement).click();

    // Sin DELETE ni GET adicionales pendientes; el cliente sigue en pantalla.
    expect(toastTypes()).not.toContain('success');
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez López');
  });

  // Comprueba que un DELETE fallido no elimine visualmente al cliente ni recargue la
  // lista (la fila permanece) y deja constancia del BUG NG0600 en el toast de error.
  it('EVIDENCIA: una eliminación fallida conserva la fila (NG0600 en el toast)', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    startAndFlushInitial([dto()]);
    dialogOpen.mockReturnValue({ closed: of(true) } as never);

    page.onDeleteClient({
      id: 25,
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: null,
      direccion: null,
      rfc: null,
    });

    httpMock
      .expectOne(`${CLIENTES}/25`)
      .flush({ message: 'Cliente con ventas asociadas.' }, { status: 409, statusText: 'Conflict' });
    render();

    expect(toastTypes()).not.toContain('success');
    expect(TestBed.inject(ClientsFacade).errorMessage()).toBe('Cliente con ventas asociadas.');
    expectNg0600Evidence(errorSpy);
    expect(fixture.nativeElement.querySelectorAll('.client-row')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez López');
    errorSpy.mockRestore();
  });

  // ---------- E. Comunicación entre componentes ----------

  // Comprueba que las opciones del diálogo de alta/edición se rendericen con los datos
  // del catálogo que llegaron por HTTP (tabla -> facade -> señales -> vista).
  it('la tabla refleja cambios de señal de la fachada y resalta el flujo de datos', () => {
    startAndFlushInitial([dto()]);

    // Cambio de estado posterior proveniente de la fachada (p. ej. otra recarga).
    const facade = TestBed.inject(ClientsFacade);
    // Simula una segunda pasada de carga con otro cliente.
    fixture.detectChanges();
    facade.loadClients();
    httpMock.expectOne(CLIENTES).flush([dto({ id: 30, nombre: 'María', apellido_paterno: 'Gómez', apellido_materno: null })]);
    render();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('María Gómez');
    expect(text).not.toContain('Juan Pérez López');
  });

  // Lee el estado de carga real de la fachada (evita import circular de types en el test).
  function facadeLoading(): boolean {
    return TestBed.inject(ClientsFacade).loading();
  }
});
