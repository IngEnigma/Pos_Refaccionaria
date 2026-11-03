import { ProductMapper } from './product.mapper';
import { ProductResponseDto, ProductStockResponseDto } from '@features/inventory/application/dtos/product-response.dto';
import { CreateProductPayload, UpdateProductPayload } from '@features/inventory/domain/repository/product-repository';

// Unitario: transformaciones puras DTO <-> dominio, sin dependencias.
describe('ProductMapper', () => {
  const dto: ProductResponseDto = {
    id: 7,
    id_tipo: 3,
    id_proveedor: 11,
    clave: 'SKU-7',
    nombre: 'Rótula',
    descripcion: 'Rear axle',
    codigo_barras: '75010000000007',
    precio_venta: 494.36,
    marca: 'Moog',
    costo: 300.5,
    codigoSAT: 'SAT-7',
  };

  // Comprueba que los campos snake_case se conviertan a camelCase con los números convertidos.
  it('fromResponseDto convierte snake_case a camelCase y los precios a número', () => {
    const product = ProductMapper.fromResponseDto(dto);

    expect(product).toEqual({
      id: 7,
      idTipo: 3,
      idProveedor: 11,
      clave: 'SKU-7',
      nombre: 'Rótula',
      descripcion: 'Rear axle',
      codigoBarras: '75010000000007',
      precioVenta: 494.36,
      marca: 'Moog',
      costo: 300.5,
      codigoSat: 'SAT-7',
    });
  });

  // Comprueba que un codigoSAT ausente o vacío del backend quede como null en dominio.
  it('fromResponseDto normaliza codigoSAT ausente a null', () => {
    const product = ProductMapper.fromResponseDto({ ...dto, codigoSAT: undefined as unknown as string | null });

    expect(product.codigoSat).toBeNull();
  });

  // Comprueba que la variante de stock agregue cantidad y precios de sucursal.
  it('fromStockResponseDto agrega cantidad, precio de sucursal y base', () => {
    const stockDto: ProductStockResponseDto = {
      ...dto,
      cantidad: 47,
      precio_sucursal: '494.36',
      precio_base: '520.38',
      vigente_desde: '2026-09-01T00:00:00Z',
      id_sucursal: 1,
    };

    const stock = ProductMapper.fromStockResponseDto(stockDto);

    expect(stock.cantidad).toBe(47);
    expect(stock.precioSucursal).toBe(494.36);
    expect(stock.precioBase).toBe(520.38);
    expect(stock.vigenteDesde).toBe('2026-09-01T00:00:00Z');
    expect(stock.idSucursal).toBe(1);
    expect(stock.nombre).toBe('Rótula');
  });

  // Comprueba que precio_sucursal null (sin precio activo en la sucursal) se conserve como null.
  it('fromStockResponseDto mantiene precio_sucursal null como null', () => {
    const stockDto: ProductStockResponseDto = {
      ...dto,
      cantidad: 0,
      precio_sucursal: null,
      precio_base: '520.38',
      vigente_desde: null,
      id_sucursal: 2,
    };

    const stock = ProductMapper.fromStockResponseDto(stockDto);

    expect(stock.precioSucursal).toBeNull();
    expect(stock.vigenteDesde).toBeNull();
  });

  // Comprueba que un arreglo simple se trate como página única con totales derivados.
  it('mapPaginatedResponse acepta un arreglo como página única', () => {
    const result = ProductMapper.mapPaginatedResponse([dto]);

    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(1);
  });

  // Comprueba que la forma {results, total, page, page_size} del backend se mapee completa.
  it('mapPaginatedResponse mapea la forma results del backend', () => {
    const result = ProductMapper.mapPaginatedResponse({ results: [dto], total: 40, page: 2, page_size: 15 });

    expect(result.data[0].nombre).toBe('Rótula');
    expect(result.total).toBe(40);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
  });

  // Comprueba que también se acepte la forma alternativa {data, page, limit}.
  it('mapPaginatedResponse mapea la forma data/limit alternativa', () => {
    const result = ProductMapper.mapPaginatedResponse({ data: [dto], total: 1, page: 3, limit: 10 });

    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });

  // Comprueba que una respuesta sin productos ni metadatos deje una página vacía con valores por defecto.
  it('mapPaginatedResponse con forma desconocida produce página vacía por defecto', () => {
    const result = ProductMapper.mapPaginatedResponse({ items: [] });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(15);
  });

  // Comprueba que la variante de stock también soporte el arreglo simple.
  it('mapStockPaginatedResponse acepta un arreglo simple', () => {
    const stockDto: ProductStockResponseDto = {
      ...dto,
      cantidad: 5,
      precio_sucursal: null,
      precio_base: '520.38',
      vigente_desde: null,
      id_sucursal: 1,
    };

    const result = ProductMapper.mapStockPaginatedResponse([stockDto]);

    expect(result.data).toHaveLength(1);
    expect((result.data[0] as { cantidad?: number }).cantidad).toBe(5);
    expect(result.total).toBe(1);
  });

  // Comprueba que el payload de alta salga en snake_case con los nombres exactos del backend.
  it('toCreateRequestDto convierte el payload a snake_case', () => {
    const payload: CreateProductPayload = {
      idTipo: 3,
      idProveedor: 11,
      clave: 'SKU-7',
      nombre: 'Rótula',
      descripcion: 'desc',
      codigoBarras: '750',
      precioVenta: 494.36,
      marca: 'Moog',
      costo: 300.5,
      codigoSat: 'SAT-7',
    };

    expect(ProductMapper.toCreateRequestDto(payload)).toEqual({
      id_tipo: 3,
      id_proveedor: 11,
      clave: 'SKU-7',
      nombre: 'Rótula',
      descripcion: 'desc',
      codigo_barras: '750',
      precio_venta: 494.36,
      marca: 'Moog',
      costo: 300.5,
      codigoSAT: 'SAT-7',
    });
  });

  // Comprueba que el payload de actualización parcial conserve los campos presentes en snake_case.
  it('toUpdateRequestDto convierte el payload parcial a snake_case', () => {
    const payload: UpdateProductPayload = { nombre: 'Nuevo nombre', precioVenta: 99.9 };

    expect(ProductMapper.toUpdateRequestDto(payload)).toEqual({
      id_tipo: undefined,
      id_proveedor: undefined,
      clave: undefined,
      nombre: 'Nuevo nombre',
      descripcion: undefined,
      codigo_barras: undefined,
      precio_venta: 99.9,
      marca: undefined,
      costo: undefined,
      codigoSAT: undefined,
    });
  });
});
