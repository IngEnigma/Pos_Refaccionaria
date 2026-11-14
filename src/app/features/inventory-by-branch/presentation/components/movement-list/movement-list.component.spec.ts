import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom } from '@angular/core';
import {
  LucideAngularModule,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Info,
  History,
} from 'lucide-angular';

import { MovementListComponent } from './movement-list.component';
import { InventoryMovement } from '@features/inventory-by-branch/domain/entities/inventory-movement.entity';

// Unitario: lista de movimientos con utilidades de presentación (iconos, etiquetas, fechas)
// y sus estados de carga/vacío.
describe('MovementListComponent', () => {
  let fixture: ComponentFixture<MovementListComponent>;
  let component: MovementListComponent;

  // Iconos lucide del template/métodos; sin ellos el render lanza error.
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        importProvidersFrom(
          LucideAngularModule.pick({ ArrowDownLeft, ArrowUpRight, Activity, Info, History }),
        ),
      ],
    });
  });

  const entrada: InventoryMovement = {
    id: 1,
    tipo: 'ENTRADA',
    cantidad: 10,
    fecha: '2026-09-18T12:00:00',
    razon: 'Compra',
    observaciones: 'Factura F-001',
  };

  const salida: InventoryMovement = {
    id: 2,
    tipo: 'SALIDA',
    cantidad: 1,
    fecha: '2026-09-19T08:30:00',
    razon: 'Venta',
    observaciones: null,
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(MovementListComponent);
    component = fixture.componentInstance;
  });

  function setup(movements: InventoryMovement[], loading = false): void {
    fixture.componentRef.setInput('movements', movements);
    fixture.componentRef.setInput('loading', loading);
    fixture.detectChanges();
  }

  // Comprueba que las entradas usen la etiqueta e icono de entrada y las salidas los de salida.
  it('etiqueta e icono según el tipo de movimiento', () => {
    expect(component.movementLabel('ENTRADA')).toBe('Entrada');
    expect(component.movementLabel('SALIDA')).toBe('Salida');
    expect(component.movementIcon('ENTRADA')).toBe('ArrowDownLeft');
    expect(component.movementIcon('SALIDA')).toBe('ArrowUpRight');
    expect(component.movementClass('ENTRADA')).toBe('entrada');
    expect(component.movementClass('SALIDA')).toBe('salida');
  });

  // Comprueba que un tipo desconocido no rompa la presentación (valores por defecto).
  it('tipo desconocido usa valores por defecto', () => {
    const unknown = 'OTRO' as InventoryMovement['tipo'];

    expect(component.movementLabel(unknown)).toBe('OTRO');
    expect(component.movementIcon(unknown)).toBe('Activity');
    expect(component.movementClass(unknown)).toBe('');
  });

  // Comprueba que la fecha se formatee en es-MX con día, mes y año.
  it('formatDate devuelve una fecha en formato es-MX con año', () => {
    const formatted = component.formatDate('2026-09-18T12:00:00');

    expect(formatted).toContain('2026');
    expect(formatted).toMatch(/sept|sep/i);
  });

  // Comprueba que la lista renderice tipo, cantidad, razón y observaciones.
  it('renderiza los movimientos con sus datos', () => {
    setup([entrada, salida]);

    const text = (fixture.nativeElement as HTMLElement).textContent as string;
    expect(text).toContain('Movimientos recientes');
    expect(text).toContain('Entrada');
    expect(text).toContain('Salida');
    expect(text).toContain('Cantidad: 10');
    expect(text).toContain('Compra');
    expect(text).toContain('Factura F-001');
  });

  // Comprueba que sin movimientos se muestre el estado vacío.
  it('lista vacía muestra el estado sin movimientos', () => {
    setup([]);

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No hay movimientos registrados.',
    );
  });

  // Comprueba que en carga se muestre el skeleton y no la lista.
  it('loading muestra skeleton', () => {
    setup([], true);

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.movements-skeleton')).not.toBeNull();
    expect(html.querySelector('.movement-item')).toBeNull();
  });
});
