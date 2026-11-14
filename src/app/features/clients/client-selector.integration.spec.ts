import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from '@env/environment';
import { APP_ENV } from '@core/tokens/app-env.token';
import { LOGGING_LEVEL_TOKEN } from '@core/logging/logging-level.token';
import { LogLevel } from '@core/logging/log-level.enum';
import { ClientSelectorModalComponent } from '@features/sales/presentation/components/client-selector-modal/client-selector-modal.component';
import { ClientsFacade } from './application/facades/clients.facade';
import { GetClientsUseCase } from './application/usecase/get-clients.usecase';
import { CreateClientUseCase } from './application/usecase/create-client.usecase';
import { UpdateClientUseCase } from './application/usecase/update-client.usecase';
import { DeleteClientUseCase } from './application/usecase/delete-client.usecase';
import { ClientRepository } from './domain/repository/client-repository';
import { ClientRepositoryImpl } from './infrastructure/repositories/client-repository.impl';
import { Client } from './domain/entities/client.entity';

// Integración del selector de clientes de Ventas contra la cadena REAL de Clientes:
// Modal -> ClientsFacade -> UseCases -> Repositorio -> HttpClient -> Mapper.
// No se modifica el módulo de Ventas; solo se ejercita la colaboración con Clientes.
describe('ClientSelectorModal (integración con Clientes)', () => {
  const API = environment.apiUrl;
  const CLIENTES = `${API}/clientes`;

  let httpMock: HttpTestingController;
  let fixture: ComponentFixture<ClientSelectorModalComponent>;
  let modal: ClientSelectorModalComponent;

  const dto = (overrides = {}) => ({
    id: 25,
    id_sucursal: 1,
    nombre: 'Juan',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López',
    telefono: '2711234567',
    correo: null,
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
    fixture = TestBed.createComponent(ClientSelectorModalComponent);
    modal = fixture.componentInstance;
    // El constructor del modal dispara loadClients: el GET queda pendiente aquí.
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  function optionButtons(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.client-option') as NodeListOf<HTMLButtonElement>,
    );
  }

  // Comprueba que al abrirse el modal quede en estado de carga mientras el GET viaja
  // por la cadena real y, al responder, se rendericen los clientes mapeados.
  it('el modal carga el catálogo por HTTP y muestra las opciones mapeadas', () => {
    // Estado de carga derivado del facade real mientras el backend no responde.
    expect(TestBed.inject(ClientsFacade).loading()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Cargando clientes...');

    httpMock.expectOne(CLIENTES).flush([dto()]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Juan Pérez López');
    expect(text).toContain('2711234567');
    expect(text).not.toContain('Cargando clientes...');
  });

  // Comprueba que al elegir una opción se emita el cliente tal como se construyó
  // desde el DTO devuelto por HTTP (id y campos en camelCase).
  it('seleccionar un cliente cargado por HTTP emite la entidad mapeada', () => {
    httpMock.expectOne(CLIENTES).flush([dto()]);
    fixture.detectChanges();

    let emitted: Client | null | undefined;
    modal.select.subscribe((c) => (emitted = c));

    const option = optionButtons().find((b) => b.textContent?.includes('Juan Pérez López'));
    option?.click();

    expect(emitted).toEqual({
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
  });

  // Comprueba que un fallo HTTP termine en el mensaje de error visible dentro del modal.
  it('un error HTTP durante la carga se muestra en el modal', () => {
    httpMock
      .expectOne(CLIENTES)
      .flush({ message: 'Error interno del servidor.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Error interno del servidor.');
    expect(fixture.nativeElement.textContent).not.toContain('Cargando clientes...');
  });

  // Comprueba que un catálogo vacío muestre el estado sin clientes del modal.
  it('un catálogo vacío muestra el estado sin clientes', () => {
    httpMock.expectOne(CLIENTES).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay clientes registrados.');
  });
});
