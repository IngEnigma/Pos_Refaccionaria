import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, of, throwError } from 'rxjs';

import { ClientsFacade } from './clients.facade';
import { GetClientsUseCase } from '../usecase/get-clients.usecase';
import { CreateClientUseCase } from '../usecase/create-client.usecase';
import { UpdateClientUseCase } from '../usecase/update-client.usecase';
import { DeleteClientUseCase } from '../usecase/delete-client.usecase';
import { LoggerService } from '@core/logging/logger.service';
import { Client } from '@features/clients/domain/entities/client.entity';
import {
  CreateClientPayload,
  UpdateClientPayload,
} from '@features/clients/domain/repository/client-repository';

// Unitario: facade con los 4 casos de uso reemplazados por stubs. No hay HTTP.
describe('ClientsFacade', () => {
  let facade: ClientsFacade;
  let getClientsUseCase: { execute: jest.Mock };
  let createClientUseCase: { execute: jest.Mock };
  let updateClientUseCase: { execute: jest.Mock };
  let deleteClientUseCase: { execute: jest.Mock };
  let logger: { error: jest.Mock; warn: jest.Mock };

  const makeClient = (id: number, overrides: Partial<Client> = {}): Client => ({
    id,
    idSucursal: 1,
    nombre: `Cliente ${id}`,
    apellidoPaterno: 'Pérez',
    apellidoMaterno: null,
    telefono: '5512345678',
    correo: null,
    direccion: null,
    rfc: null,
    ...overrides,
  });

  const createPayload: CreateClientPayload = {
    idSucursal: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    telefono: '2711234567',
  };

  const updatePayload: UpdateClientPayload = { nombre: 'Juan Carlos' };

  // Fuerza un fallo en loadClients para observar el mensaje de error resultante.
  function loadWithError(error: unknown): void {
    getClientsUseCase.execute.mockReturnValue(throwError(() => error));
    facade.loadClients();
  }

  beforeEach(() => {
    getClientsUseCase = { execute: jest.fn() };
    createClientUseCase = { execute: jest.fn() };
    updateClientUseCase = { execute: jest.fn() };
    deleteClientUseCase = { execute: jest.fn() };
    logger = { error: jest.fn(), warn: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        ClientsFacade,
        { provide: GetClientsUseCase, useValue: getClientsUseCase },
        { provide: CreateClientUseCase, useValue: createClientUseCase },
        { provide: UpdateClientUseCase, useValue: updateClientUseCase },
        { provide: DeleteClientUseCase, useValue: deleteClientUseCase },
        {
          provide: LoggerService,
          useValue: { withContext: jest.fn().mockReturnValue(logger) },
        },
      ],
    });

    facade = TestBed.inject(ClientsFacade);
  });

  // Comprueba que antes de cualquier operación el estado esté vacío y sin errores.
  it('inicia con la lista vacía, sin carga y sin error', () => {
    expect(facade.clients()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que una carga exitosa llene la señal de clientes, apague loading y limpie errores.
  it('loadClients exitoso llena la lista y apaga el indicador de carga', () => {
    const client = makeClient(25);
    const subject = new Subject<Client[]>();
    getClientsUseCase.execute.mockReturnValue(subject);

    facade.loadClients();
    // Mientras el caso de uso no responda, la carga sigue activa.
    expect(facade.loading()).toBe(true);

    subject.next([client]);
    subject.complete();

    expect(facade.clients()).toEqual([client]);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que una respuesta sin registros deje la lista en vacío sin marcar error.
  it('loadClients con catálogo vacío deja la lista en [] sin error', () => {
    getClientsUseCase.execute.mockReturnValue(of([]));

    facade.loadClients();

    expect(facade.clients()).toEqual([]);
    expect(facade.errorMessage()).toBeNull();
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que un error HTTP con mensaje interno use ese mensaje y limpie la lista.
  it('loadClients con error HTTP usa error.error.message y limpia la lista', () => {
    loadWithError(new HttpErrorResponse({ error: { message: 'Cliente duplicado' }, status: 409 }));

    expect(facade.errorMessage()).toBe('Cliente duplicado');
    expect(facade.clients()).toEqual([]);
    expect(facade.loading()).toBe(false);
    expect(logger.error).toHaveBeenCalledWith('Failed to load clients', {
      message: 'Cliente duplicado',
    });
  });

  // Comprueba que la segunda opción de mensaje interno (error.error.error) también se use.
  it('loadClients con error HTTP usa error.error.error cuando no hay message', () => {
    loadWithError(new HttpErrorResponse({ error: { error: 'Token expirado' }, status: 401 }));

    expect(facade.errorMessage()).toBe('Token expirado');
  });

  // Comprueba que un error HTTP sin cuerpo interno caiga en el mensaje genérico de Angular.
  it('loadClients con error HTTP sin cuerpo usa el mensaje de HttpErrorResponse', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });

    loadWithError(error);

    expect(facade.errorMessage()).toBe(error.message);
  });

  // Comprueba que una excepción Error común exponga su message.
  it('loadClients con error Error usa su message', () => {
    loadWithError(new Error('boom'));

    expect(facade.errorMessage()).toBe('boom');
  });

  // Comprueba que un error desconocido use el mensaje genérico del facade.
  it('loadClients con error desconocido usa mensaje genérico', () => {
    loadWithError({ unexpected: true });

    expect(facade.errorMessage()).toBe('Ocurrió un error inesperado.');
  });

  // Comprueba que createClient delegue el payload y gestione loading alrededor de la suscripción.
  it('createClient delega el payload y apaga loading al completarse', () => {
    const created = makeClient(40);
    createClientUseCase.execute.mockReturnValue(of(created));

    let result: Client | undefined;
    facade.createClient(createPayload).subscribe((c) => (result = c));

    expect(createClientUseCase.execute).toHaveBeenCalledWith(createPayload);
    expect(result).toEqual(created);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que createClient con error exponga el mensaje y propague el error al suscriptor.
  it('createClient con error expone errorMessage y repropaga el error', () => {
    const error = new HttpErrorResponse({ error: { message: 'Datos inválidos' }, status: 400 });
    createClientUseCase.execute.mockReturnValue(throwError(() => error));

    let received: unknown;
    facade.createClient(createPayload).subscribe({ error: (e) => (received = e) });

    expect(received).toBe(error);
    expect(facade.errorMessage()).toBe('Datos inválidos');
    expect(facade.loading()).toBe(false);
    expect(logger.error).toHaveBeenCalledWith('Failed to create client', expect.anything());
  });

  // Comprueba que updateClient delegue id y payload hacia su caso de uso.
  it('updateClient delega id y payload', () => {
    const updated = makeClient(25, { nombre: 'Juan Carlos' });
    updateClientUseCase.execute.mockReturnValue(of(updated));

    let result: Client | undefined;
    facade.updateClient(25, updatePayload).subscribe((c) => (result = c));

    expect(updateClientUseCase.execute).toHaveBeenCalledWith(25, updatePayload);
    expect(result).toEqual(updated);
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que updateClient con error guarde el mensaje y repropague la excepción.
  it('updateClient con error expone errorMessage y repropaga el error', () => {
    const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    updateClientUseCase.execute.mockReturnValue(throwError(() => error));

    let received: unknown;
    facade.updateClient(25, updatePayload).subscribe({ error: (e) => (received = e) });

    expect(received).toBe(error);
    expect(facade.errorMessage()).toBe(error.message);
    expect(facade.loading()).toBe(false);
  });

  // Comprueba que deleteClient delegue el id hacia su caso de uso.
  it('deleteClient delega el id', () => {
    deleteClientUseCase.execute.mockReturnValue(of(void 0));

    facade.deleteClient(25).subscribe();

    expect(deleteClientUseCase.execute).toHaveBeenCalledWith(25);
    expect(facade.loading()).toBe(false);
    expect(facade.errorMessage()).toBeNull();
  });

  // Comprueba que deleteClient con error guarde el mensaje, apague loading y registre el fallo.
  it('deleteClient con error expone errorMessage y apaga loading', () => {
    const error = new HttpErrorResponse({ error: { error: 'Cliente en uso' }, status: 409 });
    deleteClientUseCase.execute.mockReturnValue(throwError(() => error));

    let received: unknown;
    facade.deleteClient(25).subscribe({ error: (e) => (received = e) });

    expect(received).toBe(error);
    expect(facade.errorMessage()).toBe('Cliente en uso');
    expect(facade.loading()).toBe(false);
    expect(logger.error).toHaveBeenCalledWith('Failed to delete client', expect.anything());
  });
});
