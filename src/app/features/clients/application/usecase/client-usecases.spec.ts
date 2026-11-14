import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { GetClientsUseCase } from './get-clients.usecase';
import { CreateClientUseCase } from './create-client.usecase';
import { UpdateClientUseCase } from './update-client.usecase';
import { DeleteClientUseCase } from './delete-client.usecase';
import { ClientRepository } from '@features/clients/domain/repository/client-repository';
import { Client } from '@features/clients/domain/entities/client.entity';

// Unitario: los 4 casos de uso son fachadas delgadas hacia el repositorio.
describe('Casos de uso de clientes', () => {
  let repository: {
    getClients: jest.Mock;
    createClient: jest.Mock;
    updateClient: jest.Mock;
    deleteClient: jest.Mock;
  };
  let getClients: GetClientsUseCase;
  let createClient: CreateClientUseCase;
  let updateClient: UpdateClientUseCase;
  let deleteClient: DeleteClientUseCase;

  const client: Client = {
    id: 25,
    idSucursal: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: null,
    telefono: '2711234567',
    correo: null,
    direccion: null,
    rfc: null,
  };

  const createPayload = {
    idSucursal: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    telefono: '2711234567',
  };

  beforeEach(() => {
    repository = {
      getClients: jest.fn(),
      createClient: jest.fn(),
      updateClient: jest.fn(),
      deleteClient: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ClientRepository, useValue: repository },
        GetClientsUseCase,
        CreateClientUseCase,
        UpdateClientUseCase,
        DeleteClientUseCase,
      ],
    });

    getClients = TestBed.inject(GetClientsUseCase);
    createClient = TestBed.inject(CreateClientUseCase);
    updateClient = TestBed.inject(UpdateClientUseCase);
    deleteClient = TestBed.inject(DeleteClientUseCase);
  });

  // Comprueba que GetClientsUseCase consulte el catálogo y devuelva su observable sin transformar.
  it('GetClientsUseCase delega en repository.getClients', () => {
    const expected = of([client]);
    repository.getClients.mockReturnValue(expected);

    const result = getClients.execute();

    expect(repository.getClients).toHaveBeenCalledTimes(1);
    expect(result).toBe(expected);
  });

  // Comprueba que CreateClientUseCase pase el payload completo al repositorio.
  it('CreateClientUseCase delega el payload en repository.createClient', () => {
    const expected = of(client);
    repository.createClient.mockReturnValue(expected);

    const result = createClient.execute(createPayload);

    expect(repository.createClient).toHaveBeenCalledWith(createPayload);
    expect(result).toBe(expected);
  });

  // Comprueba que UpdateClientUseCase pase tanto el id como el payload al repositorio.
  it('UpdateClientUseCase delega id y payload en repository.updateClient', () => {
    const expected = of(client);
    repository.updateClient.mockReturnValue(expected);

    const result = updateClient.execute(25, { nombre: 'Juan Carlos' });

    expect(repository.updateClient).toHaveBeenCalledWith(25, { nombre: 'Juan Carlos' });
    expect(result).toBe(expected);
  });

  // Comprueba que DeleteClientUseCase pase solo el id al repositorio.
  it('DeleteClientUseCase delega el id en repository.deleteClient', () => {
    const expected = of(void 0);
    repository.deleteClient.mockReturnValue(expected);

    const result = deleteClient.execute(25);

    expect(repository.deleteClient).toHaveBeenCalledWith(25);
    expect(result).toBe(expected);
  });
});
