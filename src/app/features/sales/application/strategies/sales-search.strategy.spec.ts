import { TestBed } from '@angular/core/testing';

import { SalesProduct } from '@features/sales/presentation/models/sales-ui.models';
import { SalesSearchStrategy } from './sales-search.strategy';

describe('SalesSearchStrategy', () => {
  let strategy: SalesSearchStrategy;

  const product = (overrides: Partial<SalesProduct>): SalesProduct => ({
    id: 1,
    nombre: '',
    descripcion: '',
    precio: 100,
    stock: 5,
    codigoBarras: '',
    imagen: '',
    hasSucursalPrice: true,
    ...overrides,
  });

  const filtro = product({
    id: 1,
    nombre: 'Filtro de aceite',
    descripcion: 'Filtro para motor',
    codigoBarras: '7501000000001',
  });
  const balata = product({
    id: 2,
    nombre: 'Balata delantera',
    descripcion: 'Juego de frenos',
    codigoBarras: '7501000000002',
  });
  const bujia = product({
    id: 3,
    nombre: 'Bujía',
    descripcion: 'Encendido del motor',
    codigoBarras: '7501000000003',
  });
  const items = [filtro, balata, bujia];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [SalesSearchStrategy] });
    strategy = TestBed.inject(SalesSearchStrategy);
  });

  // Sin consulta: devuelve la misma lista sin filtrar.
  it.each([[''], ['   '], ['\t']])('devuelve todos los items si la consulta es %p', (query) => {
    expect(strategy.search(items, query)).toBe(items);
  });

  // Código de barras exacto: devuelve únicamente ese producto.
  it('devuelve solo el producto cuyo código de barras coincide exactamente', () => {
    expect(strategy.search(items, '7501000000002')).toEqual([balata]);
  });

  // El lector de códigos suele añadir espacios: la consulta se recorta antes de comparar.
  it('ignora espacios alrededor del código de barras', () => {
    expect(strategy.search(items, '  7501000000003  ')).toEqual([bujia]);
  });

  // Búsqueda difusa por nombre.
  it('encuentra productos por nombre', () => {
    const result = strategy.search(items, 'balata');

    expect(result[0]).toBe(balata);
  });

  // Tolerancia a errores de tecleo.
  it('tolera un error de tecleo en el nombre', () => {
    const result = strategy.search(items, 'fltro');

    expect(result[0]).toBe(filtro);
  });

  // Búsqueda difusa por descripción.
  it('encuentra productos por descripción', () => {
    const result = strategy.search(items, 'encendido');

    expect(result[0]).toBe(bujia);
  });

  // Peso de campos: una coincidencia en nombre va antes que una en descripción.
  it('ordena primero las coincidencias de nombre sobre las de descripción', () => {
    const porNombre = product({ id: 10, nombre: 'Amortiguador', descripcion: 'Suspensión' });
    const porDescripcion = product({ id: 11, nombre: 'Kit', descripcion: 'Incluye amortiguador' });

    const result = strategy.search([porDescripcion, porNombre], 'amortiguador');

    expect(result.map((p) => p.id)).toEqual([10, 11]);
  });

  // Sin coincidencias: lista vacía.
  it('devuelve lista vacía cuando nada coincide', () => {
    expect(strategy.search(items, 'zzzzqqqq')).toEqual([]);
  });

  // Lista vacía de entrada con consulta: no falla.
  it('devuelve lista vacía si no hay items', () => {
    expect(strategy.search([], 'filtro')).toEqual([]);
  });

  // Código de barras que no coincide exacto no corta la búsqueda: cae a la difusa.
  it('si el código no coincide exacto busca de forma difusa en los campos', () => {
    const result = strategy.search(items, '75010000000');

    expect(result.length).toBeGreaterThan(0);
  });
});
