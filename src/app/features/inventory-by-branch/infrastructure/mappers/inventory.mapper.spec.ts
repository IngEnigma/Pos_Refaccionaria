import { InventoryMapper } from './inventory.mapper';
import { BranchInventoryDto, InventoryItemDto } from '@features/inventory-by-branch/application/dtos/inventory-response.dto';

// Unitario: transformaciones puras DTO <-> dominio del inventario por sucursal.
describe('InventoryMapper', () => {
  const itemDto: InventoryItemDto = {
    id: 55,
    id_producto: 7,
    nombre: 'Rótula Moog',
    clave: 'SKU-7',
    marca: 'Moog',
    codigo_barras: '75010000000007',
    precio_venta: '494.36',
    precio_sucursal: '480.00',
    precio_base: '520.38',
    costo: '300.50',
    cantidad: 47,
    vigente_desde: '2026-09-01T00:00:00Z',
  };

  // Comprueba que los precios en string del backend se conviertan a número y los ids a camelCase.
  it('fromInventoryItemDto convierte precios string a número', () => {
    const item = InventoryMapper.fromInventoryItemDto(itemDto);

    expect(item).toEqual({
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
      vigenteDesde: '2026-09-01T00:00:00Z',
    });
  });

  // Comprueba que precio_sucursal null (sin precio activo) quede como null, no NaN.
  it('fromInventoryItemDto mantiene precio_sucursal null', () => {
    const item = InventoryMapper.fromInventoryItemDto({ ...itemDto, precio_sucursal: null });

    expect(item.precioSucursal).toBeNull();
  });

  // Comprueba que vigente_desde ausente se normalice a null.
  it('fromInventoryItemDto normaliza vigente_desde ausente', () => {
    const item = InventoryMapper.fromInventoryItemDto({ ...itemDto, vigente_desde: null });

    expect(item.vigenteDesde).toBeNull();
  });

  // Comprueba que la cabecera del inventario mapee ids y sus detalles anidados.
  it('fromBranchInventoryDto mapea cabecera y detalles', () => {
    const dto: BranchInventoryDto = {
      id_inventario: 1,
      descripcion: 'Inventario General',
      id_sucursal: 1,
      detalles: [itemDto],
    };

    const inventory = InventoryMapper.fromBranchInventoryDto(dto);

    expect(inventory.idInventario).toBe(1);
    expect(inventory.descripcion).toBe('Inventario General');
    expect(inventory.idSucursal).toBe(1);
    expect(inventory.detalles).toHaveLength(1);
    expect(inventory.detalles[0].idProducto).toBe(7);
  });

  // Comprueba que un inventario sin detalles produzca un arreglo vacío en lugar de undefined.
  it('fromBranchInventoryDto con lista vacía de detalles', () => {
    const inventory = InventoryMapper.fromBranchInventoryDto({
      id_inventario: 2,
      descripcion: 'Vacío',
      id_sucursal: 2,
      detalles: [],
    });

    expect(inventory.detalles).toEqual([]);
  });
});
