import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Package, Pencil, Tag, Trash2 } from 'lucide-angular';

import { InventoryProductCardComponent } from './inventory-product-card.component';
import { Product } from '@features/inventory/domain/entities/product.entity';
import { InventoryItem } from '@features/inventory-by-branch/domain/entities/inventory-item.entity';

// Unitario: tarjeta de producto con las dos formas de datos reales (Product de catálogo
// e InventoryItem de mi-sucursal) y sus salidas de eventos.
describe('InventoryProductCardComponent', () => {
  let fixture: ComponentFixture<InventoryProductCardComponent>;
  let component: InventoryProductCardComponent;

  // Iconos lucide usados por el template (Package, Pencil, Tag, Trash2); sin ellos el render lanza error.
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(LucideAngularModule.pick({ Package, Pencil, Tag, Trash2 }))],
    });
  });

  const product: Product = {
    id: 7,
    idTipo: 1,
    idProveedor: null,
    clave: 'SKU-7',
    nombre: 'Rótula Moog',
    descripcion: 'Axle',
    codigoBarras: '75010000000007',
    precioVenta: 494.36,
    marca: 'Moog',
    costo: 300.5,
    codigoSat: null,
  };

  const item: InventoryItem = {
    id: 55,
    idProducto: 7,
    nombre: 'Rótula Moog',
    clave: 'SKU-7',
    marca: 'Moog',
    codigoBarras: '75010000000007',
    precioVenta: 494.36,
    precioSucursal: 480,
    precioBase: 520.38,
    costo: 300.5,
    cantidad: 47,
    vigenteDesde: null,
  };

  function setup(data: Product | InventoryItem): void {
    fixture = TestBed.createComponent(InventoryProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', data);
    fixture.detectChanges();
  }

  // Comprueba que para un Product simple el precio mostrado sea precioVenta y no haya stock ni precio de sucursal.
  it('con Product usa precioVenta como precio efectivo', () => {
    setup(product);

    expect(component.effectivePrice()).toBe(494.36);
    expect(component.hasSucursalPrice()).toBe(false);
    expect(component.stock()).toBeNull();
    expect(component.isLowStock()).toBe(false);
  });

  // Comprueba que para un InventoryItem con precio de sucursal se priorice ese precio.
  it('con InventoryItem prioriza el precio de sucursal', () => {
    setup(item);

    expect(component.effectivePrice()).toBe(480);
    expect(component.hasSucursalPrice()).toBe(true);
    expect(component.stock()).toBe(47);
  });

  // Comprueba que sin precio de sucursal activo se use el precio base del producto.
  it('sin precio de sucursal usa el precio base', () => {
    setup({ ...item, precioSucursal: null });

    expect(component.effectivePrice()).toBe(520.38);
    expect(component.hasSucursalPrice()).toBe(false);
  });

  // Comprueba que el stock de 5 o menos marque la tarjeta como stock bajo y 6 no.
  it('stock mínimo 5 se considera stock bajo', () => {
    setup({ ...item, cantidad: 5 });
    expect(component.isLowStock()).toBe(true);

    setup({ ...item, cantidad: 6 });
    expect(component.isLowStock()).toBe(false);
  });

  // Comprueba que con stock 0 también se marque como stock bajo (cero unidades disponibles).
  it('stock 0 se considera stock bajo', () => {
    setup({ ...item, cantidad: 0 });

    expect(component.stock()).toBe(0);
    expect(component.isLowStock()).toBe(true);
  });

  // Comprueba que los tres botones de la tarjeta emitan el producto original para editar, precio y eliminar.
  it('las acciones emiten el producto original', () => {
    setup(item);

    let modified: unknown;
    let priced: unknown;
    let deleted: unknown;
    component.modifyProduct.subscribe((p) => (modified = p));
    component.changePrice.subscribe((p) => (priced = p));
    component.deleteProduct.subscribe((p) => (deleted = p));

    component.onModify();
    component.onChangePrice();
    component.onDelete();

    expect(modified).toBe(item);
    expect(priced).toBe(item);
    expect(deleted).toBe(item);
  });

  // Comprueba que la tarjeta muestre nombre, marca y precio observables en el DOM.
  it('muestra nombre, marca y precio en el template', () => {
    setup(item);

    const text = (fixture.nativeElement as HTMLElement).textContent as string;
    expect(text).toContain('Rótula Moog');
    expect(text).toContain('Moog');
    expect(text).toContain('480');
    expect(text).toContain('47 en stock');
    expect(text).toContain('Sucursal');
  });

  // Comprueba que para un Product sin stock no se renderice el bloque de existencias.
  it('sin stock no muestra bloque de existencias', () => {
    setup(product);

    const text = (fixture.nativeElement as HTMLElement).textContent as string;
    expect(text).not.toContain('en stock');
    expect(text).not.toContain('Sucursal');
  });
});
