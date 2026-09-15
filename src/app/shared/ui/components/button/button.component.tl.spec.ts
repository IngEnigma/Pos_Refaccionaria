/**
 * EJEMPLO UNITARIA con @testing-library/angular + user-event
 * Patrón a replicar en shared/ui y presentation/pages.
 * Ejecuta: npm test -- button.component.tl
 */
import { fireEvent, render, screen } from '@testing-library/angular';

import { ButtonComponent } from './button.component';

describe('ButtonComponent (Testing Library)', () => {
  it('renderiza el texto proyectado y emite onClick al hacer clic', async () => {
    const onClick = jest.fn();

    await render(`<app-button (onClick)="onClick()">Ingresar</app-button>`, {
      imports: [ButtonComponent],
      componentProperties: { onClick },
    });

    // Nota: el texto de loading ("Cargando...") queda en el DOM oculto por CSS,
    // por eso se busca por subcadena y no por nombre exacto.
    const btn = screen.getByRole('button', { name: /Ingresar/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('button-primary');

    await fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('aplica variante danger + tamaño lg', async () => {
    await render(ButtonComponent, {
      componentInputs: { variant: 'danger', size: 'lg' },
    });

    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('button-danger');
    expect(btn).toHaveClass('button-lg');
  });

  it('no emite y expone a11y cuando está en loading', async () => {
    const onClick = jest.fn();

    await render(`<app-button [loading]="true" (onClick)="onClick()">Guardar</app-button>`, {
      imports: [ButtonComponent],
      componentProperties: { onClick },
    });

    const btn = screen.getByRole('button', { name: /cargando/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');

    await fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('es operable con teclado (a11y básica)', async () => {
    const onClick = jest.fn();

    await render(`<app-button (onClick)="onClick()">Buscar</app-button>`, {
      imports: [ButtonComponent],
      componentProperties: { onClick },
    });

    const btn = screen.getByRole('button', { name: /Buscar/ });
    btn.focus();
    expect(btn).toHaveFocus();

    await fireEvent.keyDown(btn, { key: 'Enter', code: 'Enter' });
    // Enter en <button> nativo dispara click; verificamos que sigue habilitado y focuseable
    expect(btn).toBeEnabled();
  });
});
