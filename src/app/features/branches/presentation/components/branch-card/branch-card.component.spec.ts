import { importProvidersFrom } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { Building, LucideAngularModule, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-angular';

import { Branch } from '@features/branches/domain/entities/branch.entity';
import { BranchCardComponent } from './branch-card.component';

describe('BranchCardComponent', () => {
  const branch: Branch = {
    id: 3,
    nombreSucursal: 'Sucursal Centro',
    codigoSucursal: 'SUC-003',
    ubicacion: 'Calle 1, Tuxtla',
    codigoPostal: '29000',
    numeroTelefono: '9611234567',
    correoElectronico: 'centro@trt.com',
  };

  async function renderCard(data: Branch, on: { edit?: jest.Mock; delete?: jest.Mock } = {}) {
    return render(BranchCardComponent, {
      componentInputs: { branch: data },
      on,
      providers: [
        importProvidersFrom(LucideAngularModule.pick({ Building, MapPin, Phone, Mail, Pencil, Trash2 })),
      ],
    });
  }

  it('muestra nombre, código, ubicación, teléfono y correo de la sucursal', async () => {
    await renderCard(branch);

    expect(screen.getByRole('heading', { name: 'Sucursal Centro' })).toBeInTheDocument();
    expect(screen.getByText('SUC-003')).toBeInTheDocument();
    expect(screen.getByText('Calle 1, Tuxtla')).toBeInTheDocument();
    expect(screen.getByText('9611234567')).toBeInTheDocument();
    expect(screen.getByText('centro@trt.com')).toBeInTheDocument();
  });

  it('muestra "Sin nombre" cuando la sucursal no tiene nombre', async () => {
    await renderCard({ ...branch, nombreSucursal: '' });

    expect(screen.getByRole('heading', { name: 'Sin nombre' })).toBeInTheDocument();
  });

  it('oculta código, ubicación, teléfono y correo cuando vienen vacíos', async () => {
    await renderCard({
      ...branch,
      codigoSucursal: '',
      ubicacion: '',
      numeroTelefono: '',
      correoElectronico: '',
    });

    expect(screen.queryByText('SUC-003')).not.toBeInTheDocument();
    expect(screen.queryByText('Calle 1, Tuxtla')).not.toBeInTheDocument();
    expect(screen.queryByText('9611234567')).not.toBeInTheDocument();
    expect(screen.queryByText('centro@trt.com')).not.toBeInTheDocument();
  });

  it('emite edit con la sucursal al pulsar Editar', async () => {
    const edit = jest.fn();
    await renderCard(branch, { edit });

    await fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    expect(edit).toHaveBeenCalledTimes(1);
    expect(edit).toHaveBeenCalledWith(branch);
  });

  it('emite delete con la sucursal al pulsar Eliminar', async () => {
    const onDelete = jest.fn();
    const edit = jest.fn();
    await renderCard(branch, { delete: onDelete, edit });

    await fireEvent.click(screen.getByRole('button', { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(branch);
    expect(edit).not.toHaveBeenCalled();
  });

  // H-50: la tarjeta tiene rol y nombre; los botones dicen a qué sucursal se refieren.
  it('expone la tarjeta como grupo con nombre y botones con contexto', async () => {
    await renderCard(branch);

    expect(screen.getByRole('group', { name: 'Sucursal Sucursal Centro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar sucursal Sucursal Centro' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar sucursal Sucursal Centro' })).toBeInTheDocument();
  });
});
