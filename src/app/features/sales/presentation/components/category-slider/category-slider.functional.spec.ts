import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorySliderComponent } from './category-slider.component';
import { ProductType } from '@features/sales/product-types/domain/entities/product-type.entity';

// Funcional: slider de categorías real. Sin dobles: solo el componente de producción.
describe('CategorySliderComponent (funcional)', () => {
  let fixture: ComponentFixture<CategorySliderComponent>;
  let component: CategorySliderComponent;

  const cats: ProductType[] = [
    { id: 0, nombre: 'Todos' },
    { id: 5, nombre: 'Filtros' },
  ];

  function setup(list: ProductType[], selectedId: number | null = null, loading = false) {
    fixture = TestBed.createComponent(CategorySliderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categories', list);
    fixture.componentRef.setInput('selectedCategoryId', selectedId);
    fixture.componentRef.setInput('isLoading', loading);
    fixture.detectChanges();
  }

  // Verifica que al recibir categorías sin selección emita automáticamente la primera.
  it('auto-emite la primera categoría al cargar sin selección', () => {
    const seen: ProductType[] = [];
    fixture = TestBed.createComponent(CategorySliderComponent);
    component = fixture.componentInstance;
    component.selected.subscribe((c) => seen.push(c));
    fixture.componentRef.setInput('categories', cats);
    fixture.componentRef.setInput('selectedCategoryId', null);
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    expect(seen).toEqual([{ id: 0, nombre: 'Todos' }]);
  });

  // Verifica que pulsar una categoría la emita como selección del usuario.
  it('pulsar una categoría la emite', () => {
    setup(cats, 0);

    let emitted: ProductType | undefined;
    component.selected.subscribe((c) => (emitted = c));
    const buttons = fixture.nativeElement.querySelectorAll('button.category-btn') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();

    expect(emitted).toEqual({ id: 5, nombre: 'Filtros' });
  });

  // Verifica que la categoría seleccionada se marque visualmente.
  it('marca visualmente la categoría seleccionada', () => {
    setup(cats, 5);

    const selected = fixture.nativeElement.querySelectorAll('button.category-btn.selected');
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain('Filtros');
  });

  // Verifica que durante la carga se muestren skeletons en lugar de botones.
  it('durante la carga muestra skeletons sin botones', () => {
    setup([], null, true);

    expect(fixture.nativeElement.querySelectorAll('button.category-btn')).toHaveLength(0);
    expect(fixture.nativeElement.querySelectorAll('.category-skeleton').length).toBeGreaterThan(0);
  });
});
