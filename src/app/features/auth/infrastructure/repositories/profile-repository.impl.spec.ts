import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { ProfileResponseDto } from '@features/auth/infrastructure/dtos/profile.dto';
import { ProfileRepositoryImpl } from './profile-repository.impl';

describe('ProfileRepositoryImpl', () => {
  const url = `${environment.apiUrl}/perfil/`;
  let repository: ProfileRepositoryImpl;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProfileRepositoryImpl, provideHttpClient(), provideHttpClientTesting()],
    });

    repository = TestBed.inject(ProfileRepositoryImpl);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getMyProfile', () => {
    it('hace GET /perfil/ y mapea la respuesta', () => {
      const dto: ProfileResponseDto = { id: 1, id_usuario: 7, id_sucursal: 3 };
      let result: unknown;

      repository.getMyProfile().subscribe((profile) => (result = profile));

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush(dto);
      expect(result).toEqual({ id: 1, idUsuario: 7, idSucursal: 3 });
    });

    it('propaga el error HTTP', () => {
      let status: number | undefined;

      repository.getMyProfile().subscribe({ error: (e) => (status = e.status) });

      httpMock.expectOne(url).flush('boom', { status: 500, statusText: 'Server Error' });
      expect(status).toBe(500);
    });
  });

  describe('updateMySucursal', () => {
    it('hace PUT /perfil/ con id_sucursal y mapea la respuesta', () => {
      let result: unknown;

      repository.updateMySucursal(5).subscribe((profile) => (result = profile));

      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ id_sucursal: 5 });
      req.flush({ id: 1, id_usuario: 7, id_sucursal: 5 });
      expect(result).toEqual({ id: 1, idUsuario: 7, idSucursal: 5 });
    });

    it('envía id_sucursal null para quitar la sucursal', () => {
      let result: { idSucursal: number | null } | undefined;

      repository.updateMySucursal(null).subscribe((profile) => (result = profile));

      const req = httpMock.expectOne(url);
      expect(req.request.body).toEqual({ id_sucursal: null });
      req.flush({ id: 1, id_usuario: 7, id_sucursal: null });
      expect(result?.idSucursal).toBeNull();
    });

    it('propaga el error HTTP (400 sucursal inválida)', () => {
      let status: number | undefined;

      repository.updateMySucursal(99).subscribe({ error: (e) => (status = e.status) });

      httpMock.expectOne(url).flush({ detail: 'x' }, { status: 400, statusText: 'Bad Request' });
      expect(status).toBe(400);
    });
  });
});
