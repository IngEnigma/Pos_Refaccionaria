import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';

/** H-32: el backend recorta los textos, así que solo espacios equivale a vacío. */
export const notBlank: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.length > 0 && control.value.trim() === '' ? { required: true } : null;

// Topes de sucursales/models.py: codigo_postal 10, numero_telefono 15 (H-30, H-31).
export const branchFieldValidators = {
  nombreSucursal: [Validators.required, notBlank, Validators.minLength(3)],
  ubicacion: [Validators.required, notBlank],
  codigoPostal: [Validators.required, Validators.maxLength(10)],
  numeroTelefono: [Validators.required, Validators.pattern(/^[0-9]{1,15}$/)],
  correoElectronico: [Validators.required, Validators.email],
};
