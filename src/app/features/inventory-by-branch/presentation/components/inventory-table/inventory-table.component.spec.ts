import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Package, ArrowLeftRight } from 'lucide-angular';

import { InventoryTableComponent } from './inventory-table.component';
import { InventoryItem } from '@features/inventory-by-branch/domain/entities/inventory-item.entity';

// Unitario: tabla de inventario con estados de carga/vacío y emisión de registro de movimiento.
describe('InventoryTableComponent', () => {
  let fixture: ComponentFixture<InventoryTableComponent>;
  let component: InventoryTableComponent;

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
    cantidad: 3,
    vigenteDesde: null,
  };

  // Iconos lucide usados por el template (Package, ArrowLeftRight); sin ellos el render lanza error.
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [importProvidersFrom(LucideAngularModule.pick({ Package, ArrowLeftRight }))],
    });
  });

  function setup(items: InventoryItem[], loading = false): void {
    fixture = TestBed.createComponent(InventoryTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  // Comprueba que cada fila muestre nombre, clave, marca, código de barras, stock y precio.
  it('muestra los datos del producto en cada fila', () => {
    setup([item]);

    const text = (fixture.nativeElement as HTMLElement).textContent as string;
    expect(text).toContain('Rótula Moog');
    expect(text).toContain('SKU-7');
    expect(text).toContain('Moog');
    expect(text).toContain('75010000000007');
    expect(text).toContain('3');
    expect(text).toContain('494.36');
  });

  // Comprueba que al pulsar "Movimiento" se emita el item seleccionado.
  it('el botón Movimiento emite el item', () => {
    setup([item]);

    let emitted: InventoryItem | undefined;
    component.registerMovement.subscribe((i) => (emitted = i));

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      '.btn-movement',
    ) as HTMLButtonElement;
    button.click();

    expect(emitted).toBe(item);
  });

  // Comprueba que con lista vacía se muestre el estado "sin productos" y no la tabla.
  it('lista vacía muestra el estado sin productos', () => {
    setup([]);

    const text = (fixture.nativeElement as HTMLElement).textContent as string;
    expect(text).toContain('No hay productos en el inventario de esta sucursal.');
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
  });

  // Comprueba que en carga se muestre el skeleton y se oculte la tabla.
  it('loading muestra skeleton y oculta la tabla', () => {
    setup([item], true);

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('table')).toBeNull();
    expect(html.querySelector('.table-skeleton')).not.toBeNull();
  });

  // Comprueba que el stock bajo (≤ 5) se marque con la clase de alerta en el badge.
  it('marca el badge de stock como bajo con 5 o menos unidades', () => {
    setup([{ ...item, cantidad: 5 }]);

    const badge = (fixture.nativeElement as HTMLElement).querySelector('.stock-badge') as HTMLElement;
    expect(badge.classList.contains('low')).toBe(true);
    expect(badge.textContent?.trim()).toBe('5');
  });

  // Comprueba que sin precio de sucursal no se muestre la insignia "Sucursal".
  it('sin precio de sucursal no muestra la insignia', () => {
    setup([{ ...item, precioSucursal: null }]);

    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Sucursal');
  });
});
