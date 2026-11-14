import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  LucideAngularModule,
  Edit,
  PlusCircle,
  X,
  User,
  Phone,
  FileText,
  Hash,
  MapPin,
  Check,
  Save,
} from 'lucide-angular';

import {
  ClientFormDialogComponent,
  ClientFormDialogData,
} from './client-form-dialog.component';
import { Client } from '@features/clients/domain/entities/client.entity';

// Unitario: validaciones, normalización y cierre del formulario de cliente.
describe('ClientFormDialogComponent', () => {
  let fixture: ComponentFixture<ClientFormDialogComponent>;
  let component: ClientFormDialogComponent;
  let dialogRef: { close: jest.Mock };

  const client: Client = {
    id: 25,
    idSucursal: 1,
    nombre: 'Juan',
    apellidoPaterno: 'Pérez',
    apellidoMaterno: 'López',
    telefono: '2711234567',
    correo: 'juan@ejemplo.com',
    direccion: 'Calle 1',
    rfc: 'PEJU800101',
  };

  function setup(data: ClientFormDialogData): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        // Iconos lucide del template del formulario; sin ellos el render lanza error.
        importProvidersFrom(
          LucideAngularModule.pick({
            Edit,
            PlusCircle,
            X,
            User,
            Phone,
            FileText,
            Hash,
            MapPin,
            Check,
            Save,
          }),
        ),
      ],
    });
    fixture = TestBed.createComponent(ClientFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit
  }

  // Completa el formulario con datos válidos para los casos de envío.
  function fillValidForm(): void {
    component.clientForm.setValue({
      nombre: 'María',
      apellidoPaterno: 'Gómez',
      apellidoMaterno: '',
      telefono: '2719876543',
      correo: '',
      direccion: '',
      rfc: '',
    });
  }

  beforeEach(() => {
    dialogRef = { close: jest.fn() };
  });

  // Comprueba que en modo alta el formulario arranque vacío e inválido con el título de alta.
  it('modo alta inicia vacío e inválido', () => {
    setup({ sucursalId: 1 });

    expect(component.isEditMode).toBe(false);
    expect(component.clientForm.valid).toBe(false);
    expect(component.clientForm.get('nombre')?.value).toBe('');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nuevo Cliente');
  });

  // Comprueba que en modo edición los controles se precarguen con los datos del cliente.
  it('modo edición precarga los datos del cliente', () => {
    setup({ client, sucursalId: 1 });

    expect(component.isEditMode).toBe(true);
    expect(component.clientForm.value).toEqual({
      nombre: 'Juan',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      telefono: '2711234567',
      correo: 'juan@ejemplo.com',
      direccion: 'Calle 1',
      rfc: 'PEJU800101',
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Editar Cliente');
  });

  // Comprueba que el nombre sea obligatorio y exija al menos 2 caracteres.
  it('nombre requerido y con mínimo 2 caracteres', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('nombre')?.setValue('');
    expect(component.clientForm.get('nombre')?.invalid).toBe(true);

    component.clientForm.get('nombre')?.setValue('A');
    expect(component.clientForm.get('nombre')?.invalid).toBe(true);

    component.clientForm.get('nombre')?.setValue('AB');
    expect(component.clientForm.get('nombre')?.valid).toBe(true);
  });

  // Comprueba que el apellido paterno sea obligatorio y exija al menos 2 caracteres.
  it('apellidoPaterno requerido y con mínimo 2 caracteres', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('apellidoPaterno')?.setValue('');
    expect(component.clientForm.get('apellidoPaterno')?.invalid).toBe(true);

    component.clientForm.get('apellidoPaterno')?.setValue('G');
    expect(component.clientForm.get('apellidoPaterno')?.invalid).toBe(true);

    component.clientForm.get('apellidoPaterno')?.setValue('Gómez');
    expect(component.clientForm.get('apellidoPaterno')?.valid).toBe(true);
  });

  // Comprueba que el teléfono sea obligatorio y acepte entre 7 y 15 caracteres del formato permitido.
  it('telefono requerido y acepta de 7 a 15 caracteres del formato válido', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('telefono')?.setValue('');
    expect(component.clientForm.get('telefono')?.invalid).toBe(true);

    component.clientForm.get('telefono')?.setValue('12345'); // muy corto
    expect(component.clientForm.get('telefono')?.invalid).toBe(true);

    component.clientForm.get('telefono')?.setValue('2711234567');
    expect(component.clientForm.get('telefono')?.valid).toBe(true);

    // Formatos con paréntesis, espacios y guiones también se aceptan (14 caracteres).
    component.clientForm.get('telefono')?.setValue('(271) 123-4567');
    expect(component.clientForm.get('telefono')?.valid).toBe(true);
  });

  // Comprueba que el teléfono rechace letras y longitudes fuera del rango.
  it('telefono inválido con letras o fuera de rango', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('telefono')?.setValue('no-telefono');
    expect(component.clientForm.get('telefono')?.invalid).toBe(true);

    component.clientForm.get('telefono')?.setValue('1234567890123456'); // 16 dígitos
    expect(component.clientForm.get('telefono')?.invalid).toBe(true);
  });

  // Comprueba que el correo sea opcional pero, si se escribe, exija un formato válido.
  it('correo opcional pero con formato de correo cuando se captura', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('correo')?.setValue('');
    expect(component.clientForm.get('correo')?.valid).toBe(true);

    component.clientForm.get('correo')?.setValue('no-es-correo');
    expect(component.clientForm.get('correo')?.invalid).toBe(true);

    component.clientForm.get('correo')?.setValue('maria@ejemplo.com');
    expect(component.clientForm.get('correo')?.valid).toBe(true);
  });

  // Comprueba que el RFC sea opcional y admita como máximo 13 caracteres.
  it('rfc opcional con máximo 13 caracteres', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('rfc')?.setValue('');
    expect(component.clientForm.get('rfc')?.valid).toBe(true);

    component.clientForm.get('rfc')?.setValue('GOMA800101ABC1'); // 14
    expect(component.clientForm.get('rfc')?.invalid).toBe(true);

    component.clientForm.get('rfc')?.setValue('GOMA800101ABC'); // 13
    expect(component.clientForm.get('rfc')?.valid).toBe(true);
  });

  // Comprueba que los campos opcionales restantes (apellido materno y dirección) acepten vacío.
  it('apellidoMaterno y direccion son opcionales', () => {
    setup({ client, sucursalId: 1 });

    component.clientForm.get('apellidoMaterno')?.setValue('');
    component.clientForm.get('direccion')?.setValue('');

    expect(component.clientForm.get('apellidoMaterno')?.valid).toBe(true);
    expect(component.clientForm.get('direccion')?.valid).toBe(true);
  });

  // Comprueba que al enviar inválido se marquen los campos y no se cierre el diálogo.
  it('onSubmit inválido marca los campos y no cierra', () => {
    setup({ sucursalId: 1 });

    component.onSubmit();

    expect(component.clientForm.get('nombre')?.touched).toBe(true);
    expect(component.clientForm.get('apellidoPaterno')?.touched).toBe(true);
    expect(component.clientForm.get('telefono')?.touched).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  // Comprueba que al enviar válido el payload incluya la sucursal de la data del diálogo.
  it('onSubmit válido cierra con idSucursal tomado de la data', () => {
    setup({ sucursalId: 3 });
    fillValidForm();

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({ idSucursal: 3, nombre: 'María', apellidoPaterno: 'Gómez' }),
    );
  });

  // Comprueba que los campos opcionales vacíos se normalicen a null antes de cerrar.
  it('onSubmit normaliza opcionales vacíos a null', () => {
    setup({ sucursalId: 1 });
    fillValidForm();

    component.onSubmit();

    const payload = dialogRef.close.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.apellidoMaterno).toBeNull();
    expect(payload.correo).toBeNull();
    expect(payload.direccion).toBeNull();
    expect(payload.rfc).toBeNull();
  });

  // Comprueba que isFieldInvalid solo sea true cuando el campo es inválido y ya fue tocado o modificado.
  it('isFieldInvalid solo marca campos tocados e inválidos', () => {
    setup({ sucursalId: 1 });

    component.clientForm.get('nombre')?.setValue('A'); // inválido, sin tocar
    expect(component.isFieldInvalid('nombre')).toBe(false);

    component.clientForm.get('nombre')?.markAsTouched();
    expect(component.isFieldInvalid('nombre')).toBe(true);

    component.clientForm.get('nombre')?.setValue('María');
    expect(component.isFieldInvalid('nombre')).toBe(false);
  });

  // Comprueba que el botón de envío esté deshabilitado mientras el formulario sea inválido.
  it('botón de guardar deshabilitado con formulario inválido', () => {
    setup({ sucursalId: 1 });

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    fillValidForm();
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });

  // Comprueba que cancelar cierre el diálogo sin datos.
  it('onCancel cierra el diálogo con null', () => {
    setup({ sucursalId: 1 });

    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
