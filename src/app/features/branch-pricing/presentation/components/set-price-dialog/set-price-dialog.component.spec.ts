import { importProvidersFrom } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Check, DollarSign, LucideAngularModule, X } from 'lucide-angular';

import { SetPriceDialogComponent, SetPriceDialogData } from './set-price-dialog.component';

// Unitario: validación del precio (dinero), mensajes, estado del botón y valor enviado al cerrar.
describe('SetPriceDialogComponent', () => {
  const data: SetPriceDialogData = { idProducto: 5, idSucursal: 2 };
  const ERROR_TEXT = 'El precio debe ser mayor a $0.00';
  let close: jest.Mock;

  async function setup() {
    close = jest.fn();
    const view = await render(SetPriceDialogComponent, {
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: { close } },
        // Iconos lucide del template; sin ellos el render lanza error.
        importProvidersFrom(LucideAngularModule.pick({ Check, DollarSign, X })),
      ],
    });
    return { ...view, user: userEvent.setup() };
  }

  const priceInput = () => screen.getByLabelText('Precio de Venta (MXN)') as HTMLInputElement;
  const saveButton = () => screen.getByRole('button', { name: /Fijar Precio/ });

  async function typePrice(user: ReturnType<typeof userEvent.setup>, value: string): Promise<void> {
    await user.clear(priceInput());
    await user.type(priceInput(), value);
  }

  it('renderiza el título, el campo de precio vacío y el botón guardar deshabilitado', async () => {
    await setup();

    expect(screen.getByRole('heading', { name: 'Fijar Precio de Sucursal' })).toBeInTheDocument();
    expect(priceInput()).toHaveValue(null);
    expect(priceInput()).toHaveAttribute('type', 'number');
    expect(saveButton()).toBeDisabled();
  });

  it('no muestra el mensaje de error antes de que el usuario interactúe', async () => {
    await setup();

    expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
  });

  describe('precios válidos', () => {
    it('habilita guardar y no muestra error con un precio entero válido', async () => {
      const { user } = await setup();

      await typePrice(user, '100');

      expect(saveButton()).toBeEnabled();
      expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
    });

    it.each([
      ['12.5', 12.5],
      ['1.5', 1.5],
      ['0.01', 0.01],
      ['99999.99', 99999.99],
    ])('al guardar "%s" cierra el diálogo con el precio como number %p', async (typed, expected) => {
      const { user } = await setup();

      await typePrice(user, typed);
      await user.click(saveButton());

      expect(close).toHaveBeenCalledTimes(1);
      const result = close.mock.calls[0][0];
      expect(result).toEqual({ idProducto: 5, idSucursal: 2, precioVenta: expected });
      expect(typeof result.precioVenta).toBe('number');
    });

    it('incluye idProducto e idSucursal recibidos por DIALOG_DATA', async () => {
      const { user } = await setup();

      await typePrice(user, '20');
      await user.click(saveButton());

      expect(close).toHaveBeenCalledWith(expect.objectContaining({ idProducto: 5, idSucursal: 2 }));
    });

    it('envía el formulario con Enter dentro del campo', async () => {
      const { user } = await setup();

      await typePrice(user, '45.9');
      await user.keyboard('{Enter}');

      expect(close).toHaveBeenCalledWith({ idProducto: 5, idSucursal: 2, precioVenta: 45.9 });
    });
  });

  describe('precios inválidos', () => {
    it.each([
      ['cero', '0'],
      ['negativo', '-5'],
      ['negativo con decimales', '-0.01'],
      ['por debajo del mínimo 0.01', '0.001'],
    ])('rechaza un precio %s: muestra el error y deshabilita guardar', async (_name, typed) => {
      const { user } = await setup();

      await typePrice(user, typed);

      expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('no cierra el diálogo al hacer clic en guardar con un precio negativo', async () => {
      const { user } = await setup();

      await typePrice(user, '-5');
      await user.click(saveButton());

      expect(close).not.toHaveBeenCalled();
    });

    it('rechaza el campo vacío tras haberlo editado y muestra el error', async () => {
      const { user } = await setup();

      await typePrice(user, '10');
      await user.clear(priceInput());

      expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('trata el texto no numérico como vacío (el input number lo descarta) y lo rechaza', async () => {
      await setup();

      fireEvent.input(priceInput(), { target: { value: 'abc' } });

      expect(priceInput()).toHaveValue(null);
      expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument();
      expect(saveButton()).toBeDisabled();
    });

    it('al enviar el formulario vacío (Enter) marca el campo como tocado, muestra el error y no cierra', async () => {
      await setup();

      fireEvent.submit(priceInput().closest('form') as HTMLFormElement);

      expect(close).not.toHaveBeenCalled();
      expect(await screen.findByText(ERROR_TEXT)).toBeInTheDocument();
    });

    it('vuelve a habilitar guardar al corregir un precio inválido por uno válido', async () => {
      const { user } = await setup();

      await typePrice(user, '0');
      expect(saveButton()).toBeDisabled();
      await typePrice(user, '8.75');

      expect(saveButton()).toBeEnabled();
      expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument();
    });
  });

  // H-14: la única validación es Validators.min(0.01). Estos tests documentan el
  // comportamiento ACTUAL del formulario; no afirman que sea el correcto.
  describe('comportamiento actual con decimales y límites (H-14)', () => {
    it('acepta hoy un precio con 3 decimales (10.999) y lo envía sin redondear', async () => {
      const { user } = await setup();

      await typePrice(user, '10.999');

      expect(saveButton()).toBeEnabled();
      await user.click(saveButton());
      expect(close).toHaveBeenCalledWith({ idProducto: 5, idSucursal: 2, precioVenta: 10.999 });
    });

    it('acepta hoy 1.005 sin normalizarlo a 2 decimales', async () => {
      const { user } = await setup();

      await typePrice(user, '1.005');
      await user.click(saveButton());

      expect(close.mock.calls[0][0].precioVenta).toBe(1.005);
    });

    it('acepta hoy un precio por encima del máximo del backend (decimal 10,2) porque no hay límite superior', async () => {
      const { user } = await setup();

      await typePrice(user, '1000000000');

      expect(saveButton()).toBeEnabled();
    });

    it.todo('H-14: precio con más de 2 decimales debería rechazarse');
    it.todo('H-14b: precio mayor a 99999999.99 (máximo del backend) debería rechazarse en el formulario');
    it.todo('H-14c: priceForm.setValue({ precioVenta: "abc" }) por código pasa Validators.min (NaN) y enviaría un string como precioVenta');
  });

  describe('cancelar', () => {
    it('cierra con null al pulsar Cancelar y no envía precio', async () => {
      const { user } = await setup();

      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(close).toHaveBeenCalledWith(null);
    });

    it('cierra con null al pulsar el botón Cerrar del encabezado', async () => {
      const { user } = await setup();

      await user.click(screen.getByRole('button', { name: 'Cerrar' }));

      expect(close).toHaveBeenCalledWith(null);
    });

    it('cancela aunque el precio escrito sea válido', async () => {
      const { user } = await setup();

      await typePrice(user, '50');
      await user.click(screen.getByRole('button', { name: /Cancelar/ }));

      expect(close).toHaveBeenCalledTimes(1);
      expect(close).toHaveBeenCalledWith(null);
    });
  });

  describe('isFieldInvalid', () => {
    it('devuelve false para un campo que no existe en el formulario', async () => {
      const { fixture } = await setup();

      expect(fixture.componentInstance.isFieldInvalid('inexistente')).toBe(false);
    });

    it('devuelve false mientras el campo no esté tocado ni sucio, aunque sea inválido', async () => {
      const { fixture } = await setup();

      expect(fixture.componentInstance.priceForm.get('precioVenta')?.invalid).toBe(true);
      expect(fixture.componentInstance.isFieldInvalid('precioVenta')).toBe(false);
    });
  });
});
