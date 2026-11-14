import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { BranchResponseDto } from '@features/branches/application/dtos/branch-response.dto';
import {
  CreateBranchPayload,
  UpdateBranchPayload,
} from '@features/branches/domain/repository/branch-repository';
import { BranchRepositoryImpl } from './branch-repository.impl';

const envStub: Environment = {
  apiUrl: 'http://api.test',
  production: false,
  loggingLevel: 0,
};

describe('BranchRepositoryImpl', () => {
  const endpoint = `${envStub.apiUrl}/sucursales`;
  const dto: BranchResponseDto = {
    id: 7,
    nombre_sucursal: 'Centro',
    codigo_sucursal: 'SUC-ABC123',
    ubicacion: 'Calle 1',
    codigo_postal: '29000',
    numero_telefono: '9611234567',
    correo_electronico: 'centro@trt.com',
  };
  const expectedBranch = {
    id: 7,
    nombreSucursal: 'Centro',
    codigoSucursal: 'SUC-ABC123',
    ubicacion: 'Calle 1',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };
  let repository: BranchRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BranchRepositoryImpl,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_ENV, useValue: envStub },
      ],
    });
    repository = TestBed.inject(BranchRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getBranches hace GET a /sucursales y mapea cada DTO a entidad', () => {
    let result: unknown;

    repository.getBranches().subscribe((branches) => (result = branches));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('GET');
    req.flush([dto, { id: 8, ubicacion: 'Calle 2' }]);
    expect(result).toEqual([
      expectedBranch,
      {
        id: 8,
        nombreSucursal: '',
        codigoSucursal: '',
        ubicacion: 'Calle 2',
        codigoPostal: '',
        numeroTelefono: '',
        correoElectronico: '',
      },
    ]);
  });

  it('getBranches devuelve lista vacía si el backend no tiene sucursales', () => {
    let result: unknown;

    repository.getBranches().subscribe((branches) => (result = branches));

    httpMock.expectOne(endpoint).flush([]);
    expect(result).toEqual([]);
  });

  it('getById hace GET a /sucursales/:id y mapea la respuesta', () => {
    let result: unknown;

    repository.getById(7).subscribe((branch) => (result = branch));

    const req = httpMock.expectOne(`${endpoint}/7`);
    expect(req.request.method).toBe('GET');
    req.flush(dto);
    expect(result).toEqual(expectedBranch);
  });

  it('create hace POST con el cuerpo en snake_case y mapea la sucursal creada', () => {
    const payload: CreateBranchPayload = {
      nombreSucursal: 'Centro',
      ubicacion: 'Calle 1',
      codigoPostal: '29000',
      numeroTelefono: '9611234567',
      correoElectronico: 'centro@trt.com',
    };
    let result: unknown;

    repository.create(payload).subscribe((branch) => (result = branch));

    const req = httpMock.expectOne(endpoint);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      nombre_sucursal: 'Centro',
      ubicacion: 'Calle 1',
      codigo_postal: '29000',
      numero_telefono: '9611234567',
      correo_electronico: 'centro@trt.com',
    });
    req.flush(dto);
    expect(result).toEqual(expectedBranch);
  });

  it('update hace PUT a /sucursales/:id solo con los campos informados', () => {
    const payload: UpdateBranchPayload = { nombreSucursal: 'Centro 2' };
    let result: unknown;

    repository.update(7, payload).subscribe((branch) => (result = branch));

    const req = httpMock.expectOne(`${endpoint}/7`);
    expect(req.request.method).toBe('PUT');
    expect(JSON.parse(JSON.stringify(req.request.body))).toEqual({ nombre_sucursal: 'Centro 2' });
    req.flush({ ...dto, nombre_sucursal: 'Centro 2' });
    expect(result).toEqual({ ...expectedBranch, nombreSucursal: 'Centro 2' });
  });

  it('delete hace DELETE a /sucursales/:id y completa', () => {
    let completed = false;

    repository.delete(7).subscribe({ complete: () => (completed = true) });

    const req = httpMock.expectOne(`${endpoint}/7`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(completed).toBe(true);
  });

  it('propaga el HttpErrorResponse cuando el backend responde 404', () => {
    let error: HttpErrorResponse | undefined;

    repository.getById(99).subscribe({ error: (err) => (error = err) });

    httpMock.expectOne(`${endpoint}/99`).flush({ detail: 'No encontrada' }, { status: 404, statusText: 'Not Found' });
    expect(error).toBeInstanceOf(HttpErrorResponse);
    expect(error?.status).toBe(404);
  });

  it('propaga el HttpErrorResponse cuando el backend rechaza la creación con 400', () => {
    let error: HttpErrorResponse | undefined;

    repository
      .create({
        nombreSucursal: 'X',
        ubicacion: '',
        codigoPostal: '',
        numeroTelefono: '',
        correoElectronico: '',
      })
      .subscribe({ error: (err) => (error = err) });

    httpMock.expectOne(endpoint).flush({ ubicacion: ['Este campo es requerido.'] }, { status: 400, statusText: 'Bad Request' });
    expect(error?.status).toBe(400);
    expect(error?.error).toEqual({ ubicacion: ['Este campo es requerido.'] });
  });
});
