import { importProvidersFrom } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import {
  Barcode,
  Building,
  Check,
  Edit,
  Hash,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Save,
  X,
} from 'lucide-angular';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import {
  BranchFormDialogComponent,
  BranchFormDialogData,
} from './branch-form-dialog.component';

describe('BranchFormDialogComponent', () => {
  const branch: Branch = {
    id: 3,
    nombreSucursal: 'Sucursal Centro',
    codigoSucursal: 'SUC-003',
    ubicacion: 'Calle 1, Tuxtla',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };
  const validValues = {
    nombreSucursal: 'Sucursal Norte',
    ubicacion: 'Av. Norte 10',
    codigoPostal: '29010',
    numeroTelefono: '9617654321',
    correoElectronico: 'norte@trt.com',
  };

  let dialogRef: { close: jest.Mock };

  async function setup(data: BranchFormDialogData = {}) {
    dialogRef = { close: jest.fn() };
    const result = await render(BranchFormDialogComponent, {
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        importProvidersFrom(
          LucideAngularModule.pick({
            Barcode, Building, Check, Edit, Hash, Mail, MapPin, Phone, PlusCircle, Save, X,
          }),
        ),
      ],
    });
    return { user: userEvent.setup(), ...result };
  }

  const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

  async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
    await user.type(field('Nombre de la Sucursal'), validValues.nombreSucursal);
    await user.type(field('Ubicación'), validValues.ubicacion);
    await user.type(field('Código Postal'), validValues.codigoPostal);
    await user.type(field('Teléfono'), validValues.numeroTelefono);
    await user.type(field('Correo Electrónico'), validValues.correoElectronico);
  }

  describe('modo alta', () => {
    it('muestra el título de alta y el formulario vacío', async () => {
      await setup();

      expect(screen.getByRole('heading', { name: 'Nueva Sucursal' })).toBeInTheDocument();
      expect(field('Nombre de la Sucursal')).toHaveValue('');
      expect(field('Ubicación')).toHaveValue('');
      expect(field('Código Postal')).toHaveValue('');
      expect(field('Teléfono')).toHaveValue('');
      expect(field('Correo Electrónico')).toHaveValue('');
    });

    it('no muestra el código de sucursal (lo genera el backend)', async () => {
      await setup();

      expect(screen.queryByLabelText('Código de Sucursal')).not.toBeInTheDocument();
    });

    it('deshabilita Registrar Sucursal mientras el formulario está vacío', async () => {
      await setup();

      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeDisabled();
    });

    it('habilita Registrar Sucursal cuando todos los campos son válidos', async () => {
      const { user } = await setup();

      await fillValidForm(user);

      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeEnabled();
    });
  });

  describe('modo edición', () => {
    it('muestra el título de edición y precarga los datos de la sucursal', async () => {
      await setup({ branch });

      expect(screen.getByRole('heading', { name: 'Editar Sucursal' })).toBeInTheDocument();
      expect(field('Nombre de la Sucursal')).toHaveValue('Sucursal Centro');
      expect(field('Ubicación')).toHaveValue('Calle 1, Tuxtla');
      expect(field('Código Postal')).toHaveValue('29000');
      expect(field('Teléfono')).toHaveValue('9611234567');
      expect(field('Correo Electrónico')).toHaveValue('centro@trt.com');
      expect(screen.getByRole('button', { name: /Guardar Cambios/ })).toBeEnabled();
    });

    it('muestra el código de sucursal como solo lectura', async () => {
      await setup({ branch });

      const code = field('Código de Sucursal');
      expect(code).toHaveValue('SUC-003');
      expect(code).toHaveAttribute('readonly');
    });

    it('no muestra el campo de código si la sucursal no tiene código', async () => {
      await setup({ branch: { ...branch, codigoSucursal: '' } });

      expect(screen.queryByLabelText('Código de Sucursal')).not.toBeInTheDocument();
    });

    it('al guardar sin cambios cierra con los valores precargados', async () => {
      const { user } = await setup({ branch });

      await user.click(screen.getByRole('button', { name: /Guardar Cambios/ }));

      expect(dialogRef.close).toHaveBeenCalledWith({
        nombreSucursal: 'Sucursal Centro',
        ubicacion: 'Calle 1, Tuxtla',
        codigoPostal: '29000',
        numeroTelefono: '9611234567',
        correoElectronico: 'centro@trt.com',
      });
    });
  });

  describe('validaciones', () => {
    it('no muestra mensajes de error antes de que el usuario toque los campos', async () => {
      await setup();

      expect(screen.queryByText(/es requerido/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/inválido/i)).not.toBeInTheDocument();
    });

    it('exige nombre, ubicación, código postal, teléfono y correo al tocar campos vacíos', async () => {
      await setup();

      for (const label of [
        'Nombre de la Sucursal',
        'Ubicación',
        'Código Postal',
        'Teléfono',
        'Correo Electrónico',
      ]) {
        await fireEvent.blur(field(label));
      }

      expect(screen.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeInTheDocument();
      expect(screen.getByText('La ubicación es requerida')).toBeInTheDocument();
      expect(screen.getByText('El código postal es requerido')).toBeInTheDocument();
      expect(screen.getByText('Teléfono inválido (solo números, máx. 15)')).toBeInTheDocument();
      expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
    });

    it('rechaza un nombre de menos de 3 caracteres y acepta uno de 3', async () => {
      const { user } = await setup();
      const nombre = field('Nombre de la Sucursal');

      await user.type(nombre, 'AB');
      await fireEvent.blur(nombre);
      expect(screen.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeInTheDocument();

      await user.type(nombre, 'C');
      expect(screen.queryByText('El nombre es requerido (mín. 3 caracteres)')).not.toBeInTheDocument();
    });

    it('rechaza un correo sin formato válido y acepta uno correcto', async () => {
      const { user } = await setup();
      const correo = field('Correo Electrónico');

      await user.type(correo, 'no-es-correo');
      await fireEvent.blur(correo);
      expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();

      await user.clear(correo);
      await user.type(correo, 'sucursal@trt.com');
      expect(screen.queryByText('Ingrese un correo electrónico válido')).not.toBeInTheDocument();
    });

    it('rechaza un teléfono con letras o símbolos y acepta solo dígitos', async () => {
      const { user } = await setup();
      const telefono = field('Teléfono');

      await user.type(telefono, '961-123-45');
      await fireEvent.blur(telefono);
      expect(screen.getByText('Teléfono inválido (solo números, máx. 15)')).toBeInTheDocument();

      await user.clear(telefono);
      await user.type(telefono, '9611234567');
      expect(screen.queryByText('Teléfono inválido (solo números, máx. 15)')).not.toBeInTheDocument();
    });

    it('exige código postal y lo acepta al capturarlo', async () => {
      const { user } = await setup();
      const cp = field('Código Postal');

      await fireEvent.blur(cp);
      expect(screen.getByText('El código postal es requerido')).toBeInTheDocument();

      await user.type(cp, '29000');
      expect(screen.queryByText('El código postal es requerido')).not.toBeInTheDocument();
    });

    it('marca el contenedor del campo inválido con la clase error', async () => {
      await setup();
      const correo = field('Correo Electrónico');

      await fireEvent.blur(correo);

      expect(correo.closest('.input-wrapper')).toHaveClass('error');
    });

    it('con un campo inválido mantiene deshabilitado el botón de guardar', async () => {
      const { user } = await setup();
      await fillValidForm(user);
      await user.clear(field('Correo Electrónico'));
      await user.type(field('Correo Electrónico'), 'roto');

      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeDisabled();
    });

    // El backend limita codigo_postal a 10 y numero_telefono a 15 caracteres (sucursales/models.py).
    it('H-30: rechaza un código postal de más de 10 caracteres', async () => {
      const { user } = await setup();
      await fillValidForm(user);
      await user.clear(field('Código Postal'));
      await user.type(field('Código Postal'), '12345678901');

      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeDisabled();
    });

    it('H-31: rechaza un teléfono de más de 15 dígitos', async () => {
      const { user } = await setup();
      await fillValidForm(user);
      await user.clear(field('Teléfono'));
      await user.type(field('Teléfono'), '1234567890123456');

      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeDisabled();
    });

    it('H-32: nombre y ubicación de solo espacios no son válidos', async () => {
      const { user } = await setup();
      await fillValidForm(user);
      await user.clear(field('Nombre de la Sucursal'));
      await user.type(field('Nombre de la Sucursal'), '     ');
      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeDisabled();

      await user.clear(field('Nombre de la Sucursal'));
      await user.type(field('Nombre de la Sucursal'), 'Sucursal Norte');
      await user.clear(field('Ubicación'));
      await user.type(field('Ubicación'), '   ');
      expect(screen.getByRole('button', { name: /Registrar Sucursal/ })).toBeDisabled();
    });
  });

  describe('envío y cierre', () => {
    it('al enviar con datos válidos cierra el diálogo con los valores del formulario', async () => {
      const { user } = await setup();
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: /Registrar Sucursal/ }));

      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith(validValues);
    });

    it('al enviar con el formulario inválido no cierra y marca los errores', async () => {
      await setup();

      await fireEvent.submit(document.querySelector('form') as HTMLFormElement);

      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(screen.getByText('El nombre es requerido (mín. 3 caracteres)')).toBeInTheDocument();
      expect(screen.getByText('La ubicación es requerida')).toBeInTheDocument();
      expect(screen.getByText('El código postal es requerido')).toBeInTheDocument();
      expect(screen.getByText('Teléfono inválido (solo números, máx. 15)')).toBeInTheDocument();
      expect(screen.getByText('Ingrese un correo electrónico válido')).toBeInTheDocument();
    });

    it('Cancelar cierra el diálogo sin valores', async () => {
      const { user } = await setup();

      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });

    it('el botón Cerrar cierra el diálogo sin valores aunque el formulario esté lleno', async () => {
      const { user } = await setup();
      await fillValidForm(user);

      await user.click(screen.getByRole('button', { name: 'Cerrar' }));

      expect(dialogRef.close).toHaveBeenCalledTimes(1);
      expect(dialogRef.close).toHaveBeenCalledWith(null);
    });
  });
});
