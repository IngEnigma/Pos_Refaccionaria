import { Dialog } from '@angular/cdk/dialog';
import { importProvidersFrom } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { screen } from '@testing-library/dom';
import { Building, LucideAngularModule, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-angular';
import { of } from 'rxjs';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { LOGGER_PORT } from '@core/logging/logger.port';
import { LoggerService } from '@core/logging/logger.service';
import { trailingSlashInterceptor } from '@core/interceptors/trailing-slash.interceptor';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { BranchRepository } from '@features/branches/domain/repository/branch-repository';
import { BranchRepositoryImpl } from '@features/branches/infrastructure/repositories/branch-repository.impl';
import { BranchesPageComponent } from './branches.page';

/**
 * INT-07: BranchesPage -> BranchesFacade -> use cases -> BranchRepositoryImpl -> HttpClient
 * (con trailingSlashInterceptor, como en producción). El diálogo se simula devolviendo el formulario.
 * Contrato backend (RefaccionariaBack): lista/crear/editar/borrar en `/sucursales/` y `/sucursales/<id>/`,
 * errores 400/404 como `{"error": "..."}`, 403 como `{"detail": "..."}`.
 */
describe('INT-07 Sucursales (página + facade + repositorio + http)', () => {
  const API = environment.apiUrl;
  const LISTA = `${API}/sucursales/`;
  let httpMock: HttpTestingController;
  let toasts: ToastService;
  let dialogOpen: jest.SpyInstance;

  const dto = (id: number, nombre: string) => ({
    id,
    nombre_sucursal: nombre,
    codigo_sucursal: `SUC-00${id}`,
    ubicacion: `Calle ${id}`,
    codigo_postal: '29000',
    numero_telefono: '9611234567',
    correo_electronico: `s${id}@trt.com`,
  });
  const formValues = {
    nombreSucursal: 'Sur',
    ubicacion: 'Av. Sur 3',
    codigoPostal: '29020',
    numeroTelefono: '9610000000',
    correoElectronico: 'sur@trt.com',
  };
  const lastError = () => toasts.toasts().filter((t) => t.type === 'error').at(-1)?.message;

  function configure(): ComponentFixture<BranchesPageComponent> {
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([trailingSlashInterceptor])),
        provideHttpClientTesting(),
        importProvidersFrom(LucideAngularModule.pick({ Building, MapPin, Phone, Mail, Pencil, Trash2, Plus })),
        { provide: APP_ENV, useValue: environment },
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.FATAL },
        { provide: LOGGER_PORT, useClass: LoggerService },
        { provide: BranchRepository, useClass: BranchRepositoryImpl },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    const fixture = TestBed.createComponent(BranchesPageComponent);
    fixture.detectChanges(); // ngOnInit -> GET pendiente
    return fixture;
  }

  async function setup(initial = [dto(1, 'Centro'), dto(2, 'Norte')]) {
    const fixture = configure();
    httpMock.expectOne(LISTA).flush(initial);
    fixture.detectChanges();
    return { fixture };
  }

  const closeWith = (result: unknown) => dialogOpen.mockReturnValue({ closed: of(result) } as never);
  // Refresca la vista y los efectos de la página (toast de errorMessage).
  const tick = async (view: { fixture: ComponentFixture<unknown> }) => {
    view.fixture.detectChanges();
    TestBed.flushEffects();
    view.fixture.detectChanges();
  };

  afterEach(() => {
    httpMock.verify();
    dialogOpen.mockRestore();
  });

  it('al abrir carga y muestra las sucursales del backend', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Centro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Norte' })).toBeInTheDocument();
  });

  it('crear: hace POST con los campos del backend y refresca la lista con la sucursal nueva', async () => {
    const view = await setup();
    closeWith(formValues);

    view.fixture.componentInstance.onAddBranch();

    const post = httpMock.expectOne(LISTA);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      nombre_sucursal: 'Sur',
      ubicacion: 'Av. Sur 3',
      codigo_postal: '29020',
      numero_telefono: '9610000000',
      correo_electronico: 'sur@trt.com',
    });
    post.flush(dto(3, 'Sur'));
    httpMock.expectOne(LISTA).flush([dto(1, 'Centro'), dto(2, 'Norte'), dto(3, 'Sur')]);
    await tick(view);

    expect(screen.getByRole('heading', { name: 'Sur' })).toBeInTheDocument();
    expect(toasts.toasts().some((t) => t.type === 'success' && /registrada/.test(t.message))).toBe(true);
  });

  it('editar: hace PUT a /sucursales/<id>/ y la lista muestra el cambio', async () => {
    const view = await setup();
    closeWith({ ...formValues, nombreSucursal: 'Centro Renovado' });

    view.fixture.componentInstance.onEditBranch({ id: 1 } as never);

    const put = httpMock.expectOne(`${LISTA}1/`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.nombre_sucursal).toBe('Centro Renovado');
    put.flush(dto(1, 'Centro Renovado'));
    httpMock.expectOne(LISTA).flush([dto(1, 'Centro Renovado'), dto(2, 'Norte')]);
    await tick(view);

    expect(screen.getByRole('heading', { name: 'Centro Renovado' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Centro' })).not.toBeInTheDocument();
  });

  it('eliminar: hace DELETE a /sucursales/<id>/ y la sucursal desaparece de la lista', async () => {
    const view = await setup();
    closeWith(true);

    view.fixture.componentInstance.onDeleteBranch({ id: 2, nombreSucursal: 'Norte' } as never);

    const del = httpMock.expectOne(`${LISTA}2/`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'eliminado' });
    httpMock.expectOne(LISTA).flush([dto(1, 'Centro')]);
    await tick(view);

    expect(screen.queryByRole('heading', { name: 'Norte' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Centro' })).toBeInTheDocument();
  });

  it('cancelar el diálogo no envía ninguna petición', async () => {
    const view = await setup();
    closeWith(undefined);

    view.fixture.componentInstance.onAddBranch();
    view.fixture.componentInstance.onDeleteBranch({ id: 1, nombreSucursal: 'Centro' } as never);

    httpMock.expectNone(LISTA);
    httpMock.expectNone(`${LISTA}1/`);
  });

  describe('errores del backend visibles al usuario', () => {
    it('crear con 400 {"error"}: muestra el texto del backend y no recarga la lista', async () => {
      const view = await setup();
      closeWith(formValues);

      view.fixture.componentInstance.onAddBranch();
      httpMock
        .expectOne(LISTA)
        .flush({ error: 'Ya existe una sucursal con ese código.' }, { status: 400, statusText: 'Bad Request' });
      await tick(view);

      expect(lastError()).toBe('Ya existe una sucursal con ese código.');
      httpMock.expectNone(LISTA);
    });

    it('editar con 409: muestra el mensaje del backend', async () => {
      const view = await setup();
      closeWith(formValues);

      view.fixture.componentInstance.onEditBranch({ id: 1 } as never);
      httpMock
        .expectOne(`${LISTA}1/`)
        .flush({ message: 'Conflicto: la sucursal fue modificada.' }, { status: 409, statusText: 'Conflict' });
      await tick(view);

      expect(lastError()).toBe('Conflicto: la sucursal fue modificada.');
    });

    it('eliminar con 400 {"error"} (sucursal con ventas): muestra el texto y conserva la tarjeta', async () => {
      const view = await setup();
      closeWith(true);

      view.fixture.componentInstance.onDeleteBranch({ id: 2, nombreSucursal: 'Norte' } as never);
      httpMock
        .expectOne(`${LISTA}2/`)
        .flush({ error: 'No se puede eliminar: la sucursal tiene ventas.' }, { status: 400, statusText: 'Bad Request' });
      await tick(view);

      expect(lastError()).toBe('No se puede eliminar: la sucursal tiene ventas.');
      expect(screen.getByRole('heading', { name: 'Norte' })).toBeInTheDocument();
    });

    it('crear con 403 (rol sin permiso): muestra un mensaje en vez de fallar en silencio', async () => {
      const view = await setup();
      closeWith(formValues);

      view.fixture.componentInstance.onAddBranch();
      httpMock
        .expectOne(LISTA)
        .flush({ detail: "Requiere permiso 'sucursales.admin' (rol insuficiente)" }, { status: 403, statusText: 'Forbidden' });
      await tick(view);

      expect(lastError()).toBeTruthy();
      expect(lastError()).toContain('sucursales.admin');
    });

    it('si falla la carga inicial muestra el error y el estado vacío', async () => {
      const view = { fixture: configure() };

      httpMock.expectOne(LISTA).flush({ error: 'Error interno.' }, { status: 500, statusText: 'Server Error' });
      await tick(view);

      expect(lastError()).toBe('Error interno.');
      expect(screen.getByText('No se encontraron sucursales registradas.')).toBeInTheDocument();
    });
  });
});
