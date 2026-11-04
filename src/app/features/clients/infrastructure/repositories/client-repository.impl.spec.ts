import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ClientRepositoryImpl } from './client-repository.impl';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { Client } from '@features/clients/domain/entities/client.entity';
import { ClientResponseDto } from '@features/clients/application/dtos/client-response.dto';

// Unitario: adaptador HTTP aislado con HttpTestingController. Verifica URLs, bodies y mapeo.
describe('ClientRepositoryImpl', () => {
  let repository: ClientRepositoryImpl;
  let httpMock: HttpTestingController;

  const envStub: Environment = { apiUrl: 'http://api.test', production: false, loggingLevel: 0 };
  const endpoint = 'http://api.test/clientes';

  const dto: ClientResponseDto = {
    id: 25,
    id_sucursal: 1,
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López',
    telefono: '2711234567',
    correo: 'juan@ejemplo.com',
    direccion: null,
    rfc: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClientRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(ClientRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // Comprueba que getClients haga GET al endpoint raíz y mapee cada DTO a entidad.
  it('getClients hace GET al endpoint y mapea el listado', () => {
    let response: Client[] | undefined;
    repository.getClients().subscribe((r) => (response = r));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('GET');
    req.flush([dto]);

    expect(response).toHaveLength(1);
    expect(response?.[0].id).toBe(25);
    expect(response?.[0].idSucursal).toBe(1);
    expect(response?.[0].apellidoPaterno).toBe('Pérez');
    expect(response?.[0].apellidoMaterno).toBe('López');
  });

  // Comprueba que createClient haga POST con el body en snake_case y devuelva la entidad mapeada.
  it('createClient envía POST en snake_case y mapea la respuesta', () => {
    let created: Client | undefined;
    repository
      .createClient({
        idSucursal: 1,
        nombre: 'Juan',
        apellidoPaterno: 'Pérez',
        telefono: '2711234567',
        correo: null,
      })
      .subscribe((c) => (created = c));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      id_sucursal: 1,
      nombre: 'Juan',
      apellido_paterno: 'Pérez',
      apellido_materno: null,
      telefono: '2711234567',
      correo: null,
      direccion: null,
      rfc: null,
    });
    req.flush(dto);

    expect(created?.id).toBe(25);
    expect(created?.nombre).toBe('Juan');
  });

  // Comprueba que updateClient haga PUT al recurso del id con el payload parcial en snake_case.
  it('updateClient envía PUT al recurso del id', () => {
    let updated: Client | undefined;
    repository.updateClient(25, { nombre: 'Juan Carlos' }).subscribe((c) => (updated = c));

    const req = httpMock.expectOne(`${endpoint}/25`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      id_sucursal: undefined,
      nombre: 'Juan Carlos',
      apellido_paterno: undefined,
      apellido_materno: undefined,
      telefono: undefined,
      correo: undefined,
      direccion: undefined,
      rfc: undefined,
    });
    req.flush({ ...dto, nombre: 'Juan Carlos' });

    expect(updated?.nombre).toBe('Juan Carlos');
  });

  // Comprueba que deleteClient haga DELETE contra el recurso correcto sin cuerpo.
  it('deleteClient envía DELETE al recurso del id', () => {
    let completed = false;
    repository.deleteClient(25).subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${endpoint}/25`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
