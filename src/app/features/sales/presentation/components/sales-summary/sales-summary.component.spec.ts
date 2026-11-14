import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesSummaryComponent } from './sales-summary.component';

describe('SalesSummaryComponent', () => {
  let fixture: ComponentFixture<SalesSummaryComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SalesSummaryComponent);
  });

  function setInputs(values: Partial<Record<'subtotal' | 'descuento' | 'iva' | 'total', number>>) {
    Object.entries(values).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
  }

  const row = (label: string): string => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.summary-row') as NodeListOf<HTMLElement>);
    const found = rows.find((r) => r.textContent?.includes(label));
    if (!found) throw new Error(`Fila no encontrada: ${label}`);
    return found.textContent?.replace(/\s+/g, '') ?? '';
  };
  const total = () => (fixture.nativeElement.querySelector('.total-amount') as HTMLElement).textContent?.trim();

  // Verifica que sin entradas todo se muestre en $0.00.
  it('muestra $0.00 por defecto', () => {
    fixture.detectChanges();

    expect(row('Subtotal')).toBe('Subtotal$0.00');
    expect(row('Descuento')).toBe('Descuento$0.00');
    expect(row('IVA')).toBe('IVA$0.00');
    expect(total()).toBe('$0.00');
  });

  // Verifica formato de dos decimales (pipe number 1.2-2).
  it('formatea con dos decimales y separador de miles', () => {
    setInputs({ subtotal: 1200, descuento: 50.5, iva: 184, total: 1333.5 });

    expect(row('Subtotal')).toBe('Subtotal$1,200.00');
    expect(row('Descuento')).toBe('Descuento$50.50');
    expect(row('IVA')).toBe('IVA$184.00');
    expect(total()).toBe('$1,333.50');
  });

  // Verifica que un decimal largo se redondee a dos decimales al mostrarse.
  it('redondea a dos decimales al mostrar', () => {
    setInputs({ subtotal: 19.999, total: 0.126 });

    expect(row('Subtotal')).toBe('Subtotal$20.00');
    expect(total()).toBe('$0.13');
  });

  // Verifica que un total negativo conserve el signo (no se oculta un error de cálculo).
  it('muestra el signo de un valor negativo', () => {
    setInputs({ total: -10 });

    expect(total()).toBe('$-10.00');
  });
});
