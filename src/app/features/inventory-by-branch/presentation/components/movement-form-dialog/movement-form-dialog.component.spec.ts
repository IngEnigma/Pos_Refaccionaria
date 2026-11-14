import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { importProvidersFrom } from '@angular/core';
import {
  LucideAngularModule,
  ArrowLeftRight,
  X,
  Package,
  Hash,
  FileText,
  MessageSquare,
  Check,
} from 'lucide-angular';

import { MovementFormDialogComponent, MovementFormDialogData } from './movement-form-dialog.component';

// Unitario: formulario de movimiento con DialogRef/DIALOG_DATA simulados; valida las
// reglas realmente implementadas (cantidad mínima, razón mínima, producto requerido).
describe('MovementFormDialogComponent', () => {
  let fixture: ComponentFixture<MovementFormDialogComponent>;
  let component: MovementFormDialogComponent;
  let dialogRef: { close: jest.Mock };

  const data: MovementFormDialogData = {
    idInventario: 3,
    idProducto: 7,
    productName: 'Rótula Moog',
    stock: 47,
  };

  function setup(dialogData: MovementFormDialogData): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: dialogData },
        { provide: DialogRef, useValue: dialogRef },
        // Iconos lucide del template del formulario; sin ellos el render lanza error.
        importProvidersFrom(
          LucideAngularModule.pick({ ArrowLeftRight, X, Package, Hash, FileText, MessageSquare, Check }),
        ),
      ],
    });
    fixture = TestBed.createComponent(MovementFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // ngOnInit
  }

  beforeEach(() => {
    dialogRef = { close: jest.fn() };
  });

  // Comprueba que el formulario arranque con ENTRADA, cantidad 1 y el producto precargado.
  it('valores por defecto: entrada, cantidad 1 y producto precargado', () => {
    setup(data);

    expect(component.movementForm.value).toEqual({
      tipoMovimiento: 'ENTRADA',
      idProducto: 7,
      cantidad: 1,
      razon: '',
      observaciones: '',
      idProveedor: null,
    });
    expect(component.isSalida).toBe(false);
  });

  // Comprueba que sin producto precargado el control quede inválido (alta libre).
  it('sin idProducto el control queda inválido', () => {
    setup({ idInventario: 3 });

    expect(component.movementForm.get('idProducto')?.value).toBeNull();
    expect(component.movementForm.get('idProducto')?.invalid).toBe(true);
  });

  // Comprueba que la cantidad rechace valores menores a 1.
  it('cantidad inválida menor a 1', () => {
    setup(data);

    component.movementForm.get('cantidad')?.setValue(0);
    expect(component.movementForm.get('cantidad')?.invalid).toBe(true);

    component.movementForm.get('cantidad')?.setValue(1);
    expect(component.movementForm.get('cantidad')?.valid).toBe(true);
  });

  // Comprueba que el idProducto acepte únicamente valores >= 1.
  it('idProducto inválido con valor 0', () => {
    setup(data);

    component.movementForm.get('idProducto')?.setValue(0);
    expect(component.movementForm.get('idProducto')?.invalid).toBe(true);
  });

  // Comprueba que la razón exija al menos 3 caracteres.
  it('razón inválida con menos de 3 caracteres', () => {
    setup(data);

    component.movementForm.get('razon')?.setValue('ab');
    expect(component.movementForm.get('razon')?.invalid).toBe(true);

    component.movementForm.get('razon')?.setValue('abc');
    expect(component.movementForm.get('razon')?.valid).toBe(true);
  });

  // Comprueba que isSalida refleje el tipo de movimiento seleccionado.
  it('isSalida refleja el tipo seleccionado', () => {
    setup(data);

    component.movementForm.get('tipoMovimiento')?.setValue('SALIDA');
    expect(component.isSalida).toBe(true);
  });

  // Comprueba que al enviar inválido se marquen los campos y no se cierre el diálogo.
  it('onSubmit inválido marca campos y no cierra', () => {
    setup(data);
    component.movementForm.get('razon')?.setValue('');

    component.onSubmit();

    expect(component.movementForm.get('razon')?.touched).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  // Comprueba que al enviar válido el payload lleve idInventario del data y los valores del form.
  it('onSubmit válido cierra con idInventario y valores del formulario', () => {
    setup(data);
    component.movementForm.setValue({
      tipoMovimiento: 'SALIDA',
      idProducto: 7,
      cantidad: 2,
      razon: 'Merma',
      observaciones: 'Dañado',
      idProveedor: null,
    });

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith({
      idInventario: 3,
      tipoMovimiento: 'SALIDA',
      idProducto: 7,
      cantidad: 2,
      razon: 'Merma',
      observaciones: 'Dañado',
      idProveedor: undefined,
    });
  });

  // Comprueba que observaciones vacías y proveedor nulo se conviertan en undefined.
  it('onSubmit normaliza observaciones y proveedor vacíos', () => {
    setup(data);
    component.movementForm.patchValue({ razon: 'Compra', observaciones: '', idProveedor: null });

    component.onSubmit();

    const payload = (dialogRef.close as jest.Mock).mock.calls[0][0] as Record<string, unknown>;
    expect(payload['observaciones']).toBeUndefined();
    expect(payload['idProveedor']).toBeUndefined();
  });

  // Comprueba que cancelar cierre el diálogo sin datos.
  it('onCancel cierra con null', () => {
    setup(data);

    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  // Comprueba que isFieldInvalid solo señale campos tocados e inválidos.
  it('isFieldInvalid solo marca campos tocados e inválidos', () => {
    setup(data);

    component.movementForm.get('razon')?.setValue('x'); // inválido sin tocar
    expect(component.isFieldInvalid('razon')).toBe(false);

    component.movementForm.get('razon')?.markAsTouched();
    expect(component.isFieldInvalid('razon')).toBe(true);
  });
});
