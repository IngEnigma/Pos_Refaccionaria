import { Dialog } from '@angular/cdk/dialog';
import { importProvidersFrom, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Building, LucideAngularModule, Mail, MapPin, Pencil, Phone, Plus, Trash2 } from 'lucide-angular';
import { of, throwError } from 'rxjs';

import { BranchesFacade } from '@features/branches/application/facades/branches.facade';
import { Branch } from '@features/branches/domain/entities/branch.entity';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { BranchFormDialogComponent } from '../../components/branch-form-dialog/branch-form-dialog.component';
import { BranchesPageComponent } from './branches.page';

describe('BranchesPageComponent', () => {
  const makeBranch = (id: number, nombre: string): Branch => ({
    id,
    nombreSucursal: nombre,
    codigoSucursal: `SUC-00${id}`,
    ubicacion: `Calle ${id}`,
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: `s${id}@trt.com`,
  });
  const centro = makeBranch(1, 'Centro');
  const norte = makeBranch(2, 'Norte');
  const formValues = {
    nombreSucursal: 'Sur',
    ubicacion: 'Av. Sur 3',
    codigoPostal: '29020',
    numeroTelefono: '9610000000',
    correoElectronico: 'sur@trt.com',
  };

  let branches: ReturnType<typeof signal<readonly Branch[]>>;
  let loading: ReturnType<typeof signal<boolean>>;
  let errorMessage: ReturnType<typeof signal<string | null>>;
  let facade: {
    branches: unknown;
    loading: unknown;
    errorMessage: unknown;
    loadBranches: jest.Mock;
    createBranch: jest.Mock;
    updateBranch: jest.Mock;
    deleteBranch: jest.Mock;
  };
  let toast: { success: jest.Mock; error: jest.Mock };
  let dialogOpen: jest.SpyInstance;

  async function setup(initial: readonly Branch[] = [centro, norte]) {
    branches = signal<readonly Branch[]>(initial);
    loading = signal(false);
    errorMessage = signal<string | null>(null);
    facade = {
      branches: branches.asReadonly(),
      loading: loading.asReadonly(),
      errorMessage: errorMessage.asReadonly(),
      loadBranches: jest.fn(),
      createBranch: jest.fn(() => of(centro)),
      updateBranch: jest.fn(() => of(centro)),
      deleteBranch: jest.fn(() => of(void 0)),
    };
    toast = { success: jest.fn(), error: jest.fn() };
    // El DialogModule del template provee un Dialog real que pisa al stub del TestBed;
    // se intercepta open() en el prototipo sin alterar la página.
    dialogOpen = jest.spyOn(Dialog.prototype, 'open');

    return render(BranchesPageComponent, {
      providers: [
        importProvidersFrom(
          LucideAngularModule.pick({ Building, MapPin, Phone, Mail, Pencil, Trash2, Plus }),
        ),
        { provide: BranchesFacade, useValue: facade },
        { provide: ToastService, useValue: toast },
      ],
    });
  }

  afterEach(() => dialogOpen.mockRestore());

  // Simula el cierre del diálogo con un resultado dado.
  const closeWith = (result: unknown) => dialogOpen.mockReturnValue({ closed: of(result) } as never);

  describe('carga y listado', () => {
    it('solicita las sucursales al iniciar', async () => {
      await setup();

      expect(facade.loadBranches).toHaveBeenCalledTimes(1);
    });

    it('muestra una tarjeta por cada sucursal', async () => {
      await setup();

      expect(screen.getByRole('heading', { name: 'Centro' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Norte' })).toBeInTheDocument();
      expect(screen.queryByText('No se encontraron sucursales registradas.')).not.toBeInTheDocument();
    });

    it('muestra el estado vacío cuando no hay sucursales', async () => {
      await setup([]);

      expect(screen.getByText('No se encontraron sucursales registradas.')).toBeInTheDocument();
    });

    it('oculta tarjetas y estado vacío mientras carga', async () => {
      const { fixture } = await setup();

      loading.set(true);
      fixture.detectChanges();

      expect(screen.queryByRole('heading', { name: 'Centro' })).not.toBeInTheDocument();
      expect(screen.queryByText('No se encontraron sucursales registradas.')).not.toBeInTheDocument();
      expect(document.querySelectorAll('.skeleton-card')).toHaveLength(3);
    });

    it('no muestra toast de error cuando la facade no reporta error', async () => {
      await setup();

      expect(toast.error).not.toHaveBeenCalled();
    });

    it('muestra un toast de error cuando la facade reporta un error', async () => {
      const { fixture } = await setup();

      errorMessage.set('No fue posible cargar las sucursales.');
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(toast.error).toHaveBeenCalledWith('No fue posible cargar las sucursales.');
    });
  });

  describe('crear sucursal', () => {
    it('abre el diálogo de alta al pulsar Registrar Sucursal', async () => {
      await setup();
      closeWith(null);

      await fireEvent.click(screen.getByRole('button', { name: /registrar sucursal/i }));

      expect(dialogOpen).toHaveBeenCalledWith(BranchFormDialogComponent, { data: {} });
    });

    it('crea la sucursal con los valores del diálogo, avisa y recarga la lista', async () => {
      await setup();
      facade.loadBranches.mockClear();
      closeWith(formValues);

      await fireEvent.click(screen.getByRole('button', { name: /registrar sucursal/i }));

      expect(facade.createBranch).toHaveBeenCalledWith(formValues);
      expect(toast.success).toHaveBeenCalledWith('Sucursal registrada correctamente');
      expect(facade.loadBranches).toHaveBeenCalledTimes(1);
    });

    it('no crea nada si el diálogo se cierra sin valores', async () => {
      await setup();
      facade.loadBranches.mockClear();
      closeWith(null);

      await fireEvent.click(screen.getByRole('button', { name: /registrar sucursal/i }));

      expect(facade.createBranch).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.loadBranches).not.toHaveBeenCalled();
    });

    it('si la creación falla no avisa de éxito ni recarga la lista', async () => {
      await setup();
      facade.loadBranches.mockClear();
      facade.createBranch.mockReturnValue(throwError(() => new Error('duplicada')));
      closeWith(formValues);

      await fireEvent.click(screen.getByRole('button', { name: /registrar sucursal/i }));

      expect(facade.createBranch).toHaveBeenCalledWith(formValues);
      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.loadBranches).not.toHaveBeenCalled();
    });
  });

  describe('editar sucursal', () => {
    it('abre el diálogo con la sucursal de la tarjeta pulsada', async () => {
      await setup();
      closeWith(null);

      await fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[1]);

      expect(dialogOpen).toHaveBeenCalledWith(BranchFormDialogComponent, { data: { branch: norte } });
    });

    it('actualiza por id con los valores del diálogo, avisa y recarga la lista', async () => {
      await setup();
      facade.loadBranches.mockClear();
      closeWith(formValues);

      await fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);

      expect(facade.updateBranch).toHaveBeenCalledWith(1, formValues);
      expect(toast.success).toHaveBeenCalledWith('Sucursal actualizada correctamente');
      expect(facade.loadBranches).toHaveBeenCalledTimes(1);
    });

    it('no actualiza nada si el diálogo se cierra sin valores', async () => {
      await setup();
      facade.loadBranches.mockClear();
      closeWith(null);

      await fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);

      expect(facade.updateBranch).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.loadBranches).not.toHaveBeenCalled();
    });

    it('si la actualización falla no avisa de éxito ni recarga la lista', async () => {
      await setup();
      facade.loadBranches.mockClear();
      facade.updateBranch.mockReturnValue(throwError(() => new Error('no existe')));
      closeWith(formValues);

      await fireEvent.click(screen.getAllByRole('button', { name: /editar/i })[0]);

      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.loadBranches).not.toHaveBeenCalled();
    });
  });

  describe('eliminar sucursal', () => {
    it('pide confirmación nombrando la sucursal y con variante de peligro', async () => {
      await setup();
      closeWith(false);

      await fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

      expect(dialogOpen).toHaveBeenCalledTimes(1);
      const [component, config] = dialogOpen.mock.calls[0] as [unknown, { data: Record<string, string> }];
      expect(component).toBe(ConfirmDialogComponent);
      expect(config.data['title']).toBe('Eliminar Sucursal');
      expect(config.data['message']).toContain('"Centro"');
      expect(config.data['variant']).toBe('danger');
    });

    it('elimina por id al confirmar, avisa y recarga la lista', async () => {
      await setup();
      facade.loadBranches.mockClear();
      closeWith(true);

      await fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[1]);

      expect(facade.deleteBranch).toHaveBeenCalledWith(2);
      expect(toast.success).toHaveBeenCalledWith('Sucursal eliminada correctamente');
      expect(facade.loadBranches).toHaveBeenCalledTimes(1);
    });

    it('no elimina nada si se cancela la confirmación', async () => {
      await setup();
      facade.loadBranches.mockClear();
      closeWith(false);

      await fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

      expect(facade.deleteBranch).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.loadBranches).not.toHaveBeenCalled();
    });

    it('si la eliminación falla no avisa de éxito ni recarga la lista', async () => {
      await setup();
      facade.loadBranches.mockClear();
      facade.deleteBranch.mockReturnValue(throwError(() => new Error('tiene inventario')));
      closeWith(true);

      await fireEvent.click(screen.getAllByRole('button', { name: /eliminar/i })[0]);

      expect(facade.deleteBranch).toHaveBeenCalledWith(1);
      expect(toast.success).not.toHaveBeenCalled();
      expect(facade.loadBranches).not.toHaveBeenCalled();
    });
  });
});
