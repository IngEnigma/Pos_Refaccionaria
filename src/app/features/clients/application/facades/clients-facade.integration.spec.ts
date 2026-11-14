import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { ClientsFacade } from './clients.facade';
import { GetClientsUseCase } from '../usecase/get-clients.usecase';
import { CreateClientUseCase } from '../usecase/create-client.usecase';
import { UpdateClientUseCase } from '../usecase/update-client.usecase';
import { DeleteClientUseCase } from '../usecase/delete-client.usecase';
import { ClientRepository } from '@features/clients/domain/repository/client-repository';
import { ClientRepositoryImpl } from '@features/clients/infrastructure/repositories/client-repository.impl';
import { Client } from '@features/clients/domain/entities/client.entity';

// Integración real: Facade -> 4 UseCases reales -> Repositorio real -> HttpClient (mockeado)
// con el mapper en medio. Sin interceptores: ese borde pertenece al nivel aplicación.
describe('ClientsFacade (integración)', () => {
  const API = environment.apiUrl;
  const CLIENTES = `${API}/clientes`;
  let httpMock: HttpTestingController;
  let facade: ClientsFacade;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        ClientsFacade,
        GetClientsUseCase,
        CreateClientUseCase,
        UpdateClientUseCase,
        DeleteClientUseCase,
        { provide: ClientRepository, useClass: ClientRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    facade = TestBed.inject(ClientsFacade);
  });

  afterEach(() => httpMock.verify());

  // Verifica que loadClients haga GET, mapee los DTO a entidades y actualice el estado
  // de carga y la lista en una sola pasada por la cadena real.
  it('loadClients puebla el estado con los clientes mapeados desde el backend', () => {
    facade.loadClients();
    expect(facade.loading()).toBe(true);

    httpMock.expectOne(CLIENTES).flush([dto()]);

    expect(facade.clients()).toHaveLength(1);
    expect(facade.clients()[0]).toEqual({
      id: 25,
      idSucursal: 1,
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: 'juan@ejemplo.com',
      direccion: null,
      rfc: null,
    });
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que una respuesta vacía deje la lista en [] sin marcar error.
  it('loadClients con catálogo vacío deja la lista sin error', () => {
    facade.loadClients();

    httpMock.expectOne(CLIENTES).flush([]);

    expect(facade.clients()).toEqual([]);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  // Verifica que un 500 con {"message"} exponga ese mensaje, limpie la lista y libere la carga.
  it('loadClients ante 500 expone el mensaje del backend y libera la carga', () => {
    facade.loadClients();

    httpMock
      .expectOne(CLIENTES)
      .flush({ message: 'Error interno del servidor.' }, { status: 500, statusText: 'Server Error' });

    expect(facade.clients()).toEqual([]);
    expect(facade.errorMessage()).toBe('Error interno del servidor.');
    expect(facade.loading()).toBe(false);
  });

  // Verifica que createClient envíe el payload en snake_case, mapee la respuesta y
  // termine con loading apagado y sin error.
  it('createClient envía POST en snake_case y devuelve la entidad mapeada', () => {
    let created: Client | undefined;
    facade
      .createClient({
        idSucursal: 1,
        nombre: 'María',
        apellidoPaterno: 'Gómez',
        telefono: '2719876543',
      })
      .subscribe((c) => (created = c));
    expect(facade.loading()).toBe(true);

    const req = httpMock.expectOne(CLIENTES);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_sucursal: 1,
      nombre: 'María',
      apellido_paterno: 'Gómez',
      apellido_materno: null,
      telefono: '2719876543',
      correo: null,
      direccion: null,
      rfc: null,
    });
    req.flush(dto({ id: 40, nombre: 'María', apellido_paterno: 'Gómez', apellido_materno: null }));

    expect(created?.id).toBe(40);
    expect(created?.apellidoPaterno).toBe('Gómez');
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Verifica que un fallo de alta exponga el mensaje, apague loading y propague el error
  // al suscriptor para que la página no lo confunda con un éxito.
  it('createClient fallido expone errorMessage y propaga el error', () => {
    let received: unknown;
    facade
      .createClient({ idSucursal: 1, nombre: 'María', apellidoPaterno: 'Gómez', telefono: '2719876543' })
      .subscribe({ error: (e) => (received = e) });

    httpMock
      .expectOne(CLIENTES)
      .flush({ message: 'Datos inválidos.' }, { status: 400, statusText: 'Bad Request' });

    expect(received).toBeTruthy();
    expect(facade.errorMessage()).toBe('Datos inválidos.');
    expect(facade.loading()).toBe(false);
  });

  // Verifica que updateClient haga PUT al recurso del id con el body en snake_case.
  it('updateClient envía PUT al recurso del id con el payload transformado', () => {
    let updated: Client | undefined;
    facade.updateClient(25, { nombre: 'Juan Carlos' }).subscribe((c) => (updated = c));

    const req = httpMock.expectOne(`${CLIENTES}/25`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.nombre).toBe('Juan Carlos');
    expect(req.request.body).toHaveProperty('apellido_paterno');
    req.flush(dto({ nombre: 'Juan Carlos' }));

    expect(updated?.nombre).toBe('Juan Carlos');
    expect(facade.errorMessage()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  // Verifica que un PUT fallido exponga el mensaje del backend y repropague el error.
  it('updateClient fallido expone errorMessage y propaga el error', () => {
    let received: unknown;
    facade.updateClient(25, { nombre: 'X' }).subscribe({ error: (e) => (received = e) });

    httpMock
      .expectOne(`${CLIENTES}/25`)
      .flush({ message: 'Cliente no encontrado.' }, { status: 404, statusText: 'Not Found' });

    expect(received).toBeTruthy();
    expect(facade.errorMessage()).toBe('Cliente no encontrado.');
    expect(facade.loading()).toBe(false);
  });

  // Verifica que deleteClient haga DELETE contra el recurso correcto y complete sin error.
  it('deleteClient envía DELETE y completa la operación', () => {
    let completed = false;
    facade.deleteClient(25).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${CLIENTES}/25`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  // Verifica que un DELETE fallido exponga el mensaje, apague loading y repropague el error
  // para que la página no recargue el catálogo como si hubiera tenido éxito.
  it('deleteClient fallido expone errorMessage y propaga el error', () => {
    let received: unknown;
    facade.deleteClient(25).subscribe({ error: (e) => (received = e) });

    httpMock
      .expectOne(`${CLIENTES}/25`)
      .flush({ message: 'Cliente con ventas asociadas.' }, { status: 409, statusText: 'Conflict' });

    expect(received).toBeTruthy();
    expect(facade.errorMessage()).toBe('Cliente con ventas asociadas.');
    expect(facade.loading()).toBe(false);
  });

  // EVIDENCIA: el facade solo lee error.message / error.error / (message), no "detail"
  // (formato habitual de Django REST Framework). Con ese formato el usuario vería el
  // mensaje genérico de Angular en vez del detalle del backend. Pendiente de validación
  // con el encargado de frontend/back; no se corrige aquí.
  it('EVIDENCIA: un error con formato {detail} no se extrae en errorMessage', () => {
    facade.loadClients();

    httpMock
      .expectOne(CLIENTES)
      .flush({ detail: 'Token inválido.' }, { status: 401, statusText: 'Unauthorized' });

    // El mensaje genérico de Angular NO contiene el detalle del backend.
    expect(facade.errorMessage()).not.toContain('Token inválido.');
  });
});
