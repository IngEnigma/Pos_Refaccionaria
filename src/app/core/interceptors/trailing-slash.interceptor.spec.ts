import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { APP_ENV } from '@core/tokens/app-env.token';
import { LogLevel } from '@core/logging/log-level.enum';
import {
  SKIP_TRAILING_SLASH,
  trailingSlashInterceptor,
  withoutTrailingSlash,
} from './trailing-slash.interceptor';
import { HttpClient } from '@angular/common/http';

describe('trailingSlashInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([trailingSlashInterceptor])),
        provideHttpClientTesting(),
        {
          provide: APP_ENV,
          useValue: { apiUrl: 'http://api.test', production: false, loggingLevel: LogLevel.INFO },
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega slash final a rutas del api sin slash (ej. /productos/)', () => {
    http.get('http://api.test/productos').subscribe();
    const req = httpMock.expectOne('http://api.test/productos/');
    expect(req.request.method).toBe('GET');
  });

  it('respeta query params al agregar el slash', () => {
    http.get('http://api.test/productos?search=filtro').subscribe();
    httpMock.expectOne('http://api.test/productos/?search=filtro');
  });

  it('no toca urls que ya terminan en slash', () => {
    http.get('http://api.test/perfil/').subscribe();
    httpMock.expectOne('http://api.test/perfil/');
  });

  it('no toca urls fuera del api', () => {
    http.get('https://otro.com/recurso').subscribe();
    httpMock.expectOne('https://otro.com/recurso');
  });

  it('omite el slash con SKIP_TRAILING_SLASH (rutas usuario: login, token/refresh, users)', () => {
    http
      .post('http://api.test/login', {}, { context: withoutTrailingSlash() })
      .subscribe();
    const req = httpMock.expectOne('http://api.test/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.context.get(SKIP_TRAILING_SLASH)).toBe(true);
  });
});
