import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  LucideAngularModule,
  Edit,
  PlusCircle,
  X,
  Package,
  Tag,
  Barcode,
  Layers,
  Settings,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Check,
  Save,
} from 'lucide-angular';

import { ProductFormDialogComponent, ProductFormDialogData } from './product-form-dialog.component';
import { ProductTypesFacade } from '@features/sales';
import { Product } from '@features/inventory/domain/entities/product.entity';

// Unitario: validaciones y normalización del formulario de producto con DialogRef/DIALOG_DATA simulados.
describe('ProductFormDialogComponent', () => {
  let fixture: ComponentFixture<ProductFormDialogComponent>;
  let component: ProductFormDialogComponent;
  let dialogRef: { close: jest.Mock };
  let productTypesStub: { loadProductTypes: jest.Mock; productTypes: () => readonly unknown[] };

  const product: Product = {
    id: 7,
    idTipo: 3,
    idProveedor: 11,
    clave: 'SKU-7',
    nombre: 'Rótula Moog',
    descripcion: 'Axle part',
    codigoBarras: '75010000000007',
    precioVenta: 494.36,
    marca: 'Moog',
    costo: 300.5,
    codigoSat: 'SAT-7',
  };

  function setup(data: ProductFormDialogData): void {
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: ProductTypesFacade, useValue: productTypesStub },
        // Iconos lucide del template del formulario; sin ellos el render lanza error.
        importProvidersFrom(
          LucideAngularModule.pick({
            Edit,
            PlusCircle,
            X,
            Package,
            Tag,
            Barcode,
            Layers,
            Settings,
            DollarSign,
            TrendingUp,
            ShieldCheck,
            Check,
            Save,
          }),
        ),
      ],
    });
    fixture = TestBed.createComponent(ProductFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // dispara ngOnInit
  }

  beforeEach(() => {
    dialogRef = { close: jest.fn() };
    productTypesStub = {
      loadProductTypes: jest.fn(),
      productTypes: signal([{ id: 3, nombre: 'Frenos' }]).asReadonly(),
    };
  });

  // Comprueba que en modo alta el formulario arranque vacío, inválido y con el título "Nuevo Producto".
  it('modo alta inicia vacío e inválido', () => {
    setup({});

    expect(component.isEditMode).toBe(false);
    expect(component.productForm.valid).toBe(false);
    expect(component.productForm.get('nombre')?.value).toBe('');
    expect(component.productForm.get('precioVenta')?.value).toBe(0);
    expect(productTypesStub.loadProductTypes).toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nuevo Producto');
  });

  // Comprueba que en modo edición los controles se precarguen con los datos del producto.
  it('modo edición precarga los datos del producto', () => {
    setup({ product });

    expect(component.isEditMode).toBe(true);
    expect(component.productForm.value).toEqual({
      nombre: 'Rótula Moog',
      clave: 'SKU-7',
      codigoBarras: '75010000000007',
      idTipo: 3,
      precioVenta: 494.36,
      costo: 300.5,
      marca: 'Moog',
      descripcion: 'Axle part',
      codigoSat: 'SAT-7',
      idProveedor: 11,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Editar Producto');
  });

  // Comprueba que el nombre exija mínimo 3 caracteres.
  it('nombre inválido con menos de 3 caracteres', () => {
    setup({});

    component.productForm.get('nombre')?.setValue('ab');
    expect(component.productForm.get('nombre')?.invalid).toBe(true);

    component.productForm.get('nombre')?.setValue('abc');
    expect(component.productForm.get('nombre')?.valid).toBe(true);
  });

  // Comprueba que la clave y el código de barras sean obligatorios.
  it('clave y código de barras son obligatorios', () => {
    setup({ product });
    component.productForm.reset({ ...component.productForm.value, clave: '', codigoBarras: '' });

    expect(component.productForm.get('clave')?.invalid).toBe(true);
    expect(component.productForm.get('codigoBarras')?.invalid).toBe(true);
  });

  // Comprueba que la categoría (idTipo) sea obligatoria y acepte un valor numérico.
  it('categoría requerida: null inválido, número válido', () => {
    setup({});

    component.productForm.get('idTipo')?.setValue(null);
    expect(component.productForm.get('idTipo')?.invalid).toBe(true);

    component.productForm.get('idTipo')?.setValue(3);
    expect(component.productForm.get('idTipo')?.valid).toBe(true);
  });

  // Comprueba que precio y costo acepten cero pero rechacen valores negativos.
  it('precio y costo rechazan negativos pero aceptan cero', () => {
    setup({});

    component.productForm.get('precioVenta')?.setValue(-1);
    component.productForm.get('costo')?.setValue(-0.01);
    expect(component.productForm.get('precioVenta')?.invalid).toBe(true);
    expect(component.productForm.get('costo')?.invalid).toBe(true);

    component.productForm.get('precioVenta')?.setValue(0);
    component.productForm.get('costo')?.setValue(0);
    expect(component.productForm.get('precioVenta')?.valid).toBe(true);
    expect(component.productForm.get('costo')?.valid).toBe(true);
  });

  // Comprueba que la marca sea obligatoria.
  it('marca es obligatoria', () => {
    setup({});

    component.productForm.get('marca')?.setValue('');
    expect(component.productForm.get('marca')?.invalid).toBe(true);
  });

  // Comprueba que el código SAT, al ser opcional, rechace más de 8 caracteres y acepte vacío.
  it('código SAT: máximo 8 caracteres y opcional', () => {
    setup({});

    component.productForm.get('codigoSat')?.setValue('123456789');
    expect(component.productForm.get('codigoSat')?.invalid).toBe(true);

    component.productForm.get('codigoSat')?.setValue('12345678');
    expect(component.productForm.get('codigoSat')?.valid).toBe(true);

    component.productForm.get('codigoSat')?.setValue('');
    expect(component.productForm.get('codigoSat')?.valid).toBe(true);
  });

  // Comprueba que al enviar inválido se marquen los campos como tocados y no se cierre el diálogo.
  it('onSubmit inválido marca los campos y no cierra', () => {
    setup({});

    component.onSubmit();

    expect(component.productForm.get('nombre')?.touched).toBe(true);
    expect(component.productForm.get('clave')?.touched).toBe(true);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  // Comprueba que al enviar válido se cierre con el payload completo y las opcionales normalizadas.
  it('onSubmit válido cierra con payload y opcionales normalizadas', () => {
    setup({});

    component.productForm.setValue({
      nombre: 'Filtro de aceite',
      clave: 'FLT-1',
      codigoBarras: '750123',
      idTipo: 3,
      precioVenta: 120.5,
      costo: 80,
      marca: 'Fram',
      descripcion: '   ',
      codigoSat: '',
      idProveedor: null,
    });

    component.onSubmit();

    expect(dialogRef.close).toHaveBeenCalledWith({
      nombre: 'Filtro de aceite',
      clave: 'FLT-1',
      codigoBarras: '750123',
      idTipo: 3,
      precioVenta: 120.5,
      costo: 80,
      marca: 'Fram',
      descripcion: null,
      codigoSat: null,
      idProveedor: null,
    });
  });

  // Comprueba que una descripción con espacios se recorte en lugar de enviarse con huecos.
  it('onSubmit recorta la descripción', () => {
    setup({ product });

    component.productForm.get('descripcion')?.setValue('  Detalle útil  ');

    component.onSubmit();

    const payload = (dialogRef.close as jest.Mock).mock.calls[0][0] as { descripcion: string };
    expect(payload.descripcion).toBe('Detalle útil');
  });

  // Comprueba que cancelar cierre el diálogo sin datos.
  it('onCancel cierra el diálogo con null', () => {
    setup({});

    component.onCancel();

    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  // Comprueba que isFieldInvalid solo sea true cuando el campo es inválido y ya fue tocado o modificado.
  it('isFieldInvalid solo marca campos tocados e inválidos', () => {
    setup({});

    component.productForm.get('nombre')?.setValue('ab'); // inválido, sin tocar
    expect(component.isFieldInvalid('nombre')).toBe(false);

    component.productForm.get('nombre')?.markAsTouched();
    expect(component.isFieldInvalid('nombre')).toBe(true);

    component.productForm.get('nombre')?.setValue('válido');
    expect(component.isFieldInvalid('nombre')).toBe(false);
  });

  // Comprueba que el botón de envío quede deshabilitado mientras el formulario sea inválido.
  it('botón de guardar deshabilitado con formulario inválido', () => {
    setup({});

    fixture.detectChanges();
    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);

    component.productForm.setValue({
      nombre: 'Filtro',
      clave: 'F-1',
      codigoBarras: '750',
      idTipo: 1,
      precioVenta: 10,
      costo: 5,
      marca: 'M',
      descripcion: null,
      codigoSat: null,
      idProveedor: null,
    });
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
  });
});
