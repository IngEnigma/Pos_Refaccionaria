import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';


import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { SalesCartService } from './sales-cart.service';
import { SalesProduct } from '../models/sales-ui.models';

describe('SalesCartService', () => {
  let service: SalesCartService;
  const salesFacadeStub = {
    createCompleteSale: () => of({ id: 1 } as never),
    createSale: () => of(void 0),
    loadSales: () => void 0,
  };


  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SalesCartService,
        { provide: SalesFacade, useValue: salesFacadeStub },
      ],
    });
    service = TestBed.inject(SalesCartService);
  });

  // Verifica que agregar un producto nuevo lo registre en el carrito con cantidad 1.
  it('adds new product to cart', () => {
    const product: SalesProduct = {
      id: 99,
      nombre: 'Producto test',
      descripcion: 'Desc',
      precio: 50,
      stock: 10,
      codigoBarras: '7501234567890',
      hasSucursalPrice: false,
      imagen: 'assets/images/test.jpg',
    };

    service.addToCart(product);

    const added = service.cart().find((c) => c.productId === 99);
    expect(added).toBeTruthy();
    expect(added?.qty).toBe(1);
  });

  // Verifica que agregar dos veces el mismo producto incremente su cantidad en 1.
  it('increments quantity when product already exists', () => {
    const product: SalesProduct = {
      id: 1,
      nombre: 'Filtro de aceite',
      descripcion: 'Filtro 1234 • 2.5L',
      precio: 120,
      stock: 15,
      codigoBarras: '7501234567891',
      hasSucursalPrice: false,
      imagen: 'assets/images/filtro.jpg',
    };

    service.addToCart(product);
    const initialQty = service.cart()[0].qty;
    service.addToCart(product);

    const updated = service.cart().find((c) => c.productId === 1);
    expect(updated?.qty).toBe(initialQty + 1);
  });

  // Verifica que eliminar un item deje el carrito vacío.
  it('removes item from cart', () => {
    const product: SalesProduct = {
      id: 1,
      nombre: 'Filtro de aceite',
      precio: 120,
      stock: 15,
      codigoBarras: '7501234567892',
      hasSucursalPrice: false,
      imagen: 'assets/images/filtro.jpg',
      descripcion: '',
    };
    service.addToCart(product);

    const item = service.cart()[0];
    service.removeItem(item);
    expect(service.cart().length).toBe(0);
  });

  // Verifica que con un producto en el carrito el subtotal, IVA y total sean mayores a cero.
  it('calculates subtotal, iva, and total', () => {
    const product: SalesProduct = {
      id: 1,
      nombre: 'Filtro de aceite',
      precio: 120,
      stock: 15,
      codigoBarras: '7501234567893',
      hasSucursalPrice: false,
      imagen: 'assets/images/filtro.jpg',
      descripcion: '',
    };
    service.addToCart(product);

    const subtotal = service.subtotal();
    const iva = service.iva();
    const total = service.total();

    expect(subtotal).toBeGreaterThan(0);
    expect(iva).toBeGreaterThan(0);
    expect(total).toBeGreaterThan(0);
  });

  describe('confirmSale', () => {
    // Verifica que confirmar con el carrito vacío emita el error esperado.
    it('throws error if cart is empty', (done) => {
      service.confirmSale().subscribe({
        error: (err) => {
          expect(err.message).toBe('El carrito está vacío.');
          done();
        },
      });
    });

    // Verifica que confirmar sin método de pago emita el error esperado.
    it('throws error if no payment method selected', (done) => {
      service.addToCart({ id: 1, nombre: 'Test', precio: 10, stock: 5, codigoBarras: '001', hasSucursalPrice: false, imagen: '', descripcion: '' });
      service.confirmSale().subscribe({
        error: (err) => {
          expect(err.message).toBe('Selecciona un método de pago.');
          done();
        },
      });
    });

    // Verifica que una venta válida delegue al facade con el payload correcto y vacíe el carrito.
    it('calls facade.createCompleteSale when successful', (done) => {
      const spy = jest.spyOn(salesFacadeStub, 'createCompleteSale').mockReturnValue(of({ id: 99 } as never));
      service.addToCart({ id: 1, nombre: 'P1', precio: 100, stock: 5, codigoBarras: '003', hasSucursalPrice: false, imagen: '', descripcion: '' });
      service.selectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

      service.confirmSale().subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith({
            idMetodoPago: 1,
            productos: [{ id: 1, cantidad: 1 }]
          });
          expect(service.cart().length).toBe(0); // Cart is cleared
          done();
        }
      });
    });
  });

  describe('estado inicial', () => {
    // Verifica el estado inicial: carrito vacío, sin pago, descuento y totales en cero.
    it('inicia con carrito vacío, sin pago y totales en cero', () => {
      expect(service.cart()).toEqual([]);
      expect(service.selectedPayment()).toBeNull();
      expect(service.descuento()).toBe(0);
      expect(service.subtotal()).toBe(0);
      expect(service.iva()).toBe(0);
      expect(service.total()).toBe(0);
    });
  });

  describe('carrito', () => {
    const makeProduct = (overrides: Partial<SalesProduct> = {}): SalesProduct => ({
      id: 1,
      nombre: 'Filtro de aceite',
      descripcion: 'Desc',
      precio: 120,
      stock: 15,
      codigoBarras: '7501234567890',
      hasSucursalPrice: false,
      imagen: 'assets/images/filtro.jpg',
      ...overrides,
    });

    // Verifica que re-agregar el mismo producto no cree una línea duplicada sino qty 2.
    it('no duplica la línea al agregar el mismo producto nuevamente', () => {
      const product = makeProduct();
      service.addToCart(product);
      service.addToCart(product);
      expect(service.cart()).toHaveLength(1);
      expect(service.cart()[0].qty).toBe(2);
    });

    // Verifica que increaseQty incremente en 1 la cantidad del item.
    it('increaseQty incrementa la cantidad', () => {
      service.addToCart(makeProduct());
      const item = service.cart()[0];
      service.increaseQty(item);
      expect(service.cart()[0].qty).toBe(2);
    });

    // Verifica que decreaseQty reduzca en 1 la cantidad del item.
    it('decreaseQty decrementa la cantidad', () => {
      service.addToCart(makeProduct());
      service.addToCart(makeProduct());
      expect(service.cart()[0].qty).toBe(2);
      service.decreaseQty(service.cart()[0]);
      expect(service.cart()[0].qty).toBe(1);
    });

    // Verifica que decreaseQty nunca baje de 1 ni elimine la línea.
    it('decreaseQty no baja de 1 (no elimina la línea)', () => {
      service.addToCart(makeProduct());
      service.decreaseQty(service.cart()[0]);
      expect(service.cart()).toHaveLength(1);
      expect(service.cart()[0].qty).toBe(1);
    });

    // Verifica que removeItem elimine solo el producto indicado y conserve los demás.
    it('removeItem elimina solo el producto indicado', () => {
      service.addToCart(makeProduct({ id: 1, nombre: 'P1' }));
      service.addToCart(makeProduct({ id: 2, nombre: 'P2' }));
      service.removeItem(service.cart().find((c) => c.productId === 1)!);
      expect(service.cart()).toHaveLength(1);
      expect(service.cart()[0].productId).toBe(2);
    });

    // Verifica que eliminar un item inexistente no falle ni altere el carrito vacío.
    it('removeItem en carrito vacío no falla', () => {
      expect(() =>
        service.removeItem({ productId: 999, nombre: 'X', descripcion: 'X', precio: 1, imagen: '', qty: 1, stock: 1 }),
      ).not.toThrow();
      expect(service.cart()).toEqual([]);
    });

    // Verifica que incrementar un item inexistente deje el carrito intacto.
    it('increaseQty en item inexistente no altera el carrito', () => {
      service.addToCart(makeProduct());
      service.increaseQty({ productId: 999, nombre: 'X', descripcion: 'X', precio: 1, imagen: '', qty: 1, stock: 1 });
      expect(service.cart()).toHaveLength(1);
      expect(service.cart()[0].qty).toBe(1);
    });

    // Verifica que decrementar un item inexistente deje el carrito intacto.
    it('decreaseQty en item inexistente no altera el carrito', () => {
      service.addToCart(makeProduct());
      service.decreaseQty({ productId: 999, nombre: 'X', descripcion: 'X', precio: 1, imagen: '', qty: 1, stock: 1 });
      expect(service.cart()[0].qty).toBe(1);
    });

    // Verifica que clearCart vacíe el carrito y resetee pago, descuento y totales.
    it('clearCart vacía el carrito y resetea pago y descuento', () => {
      service.addToCart(makeProduct());
      service.selectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });
      service.clearCart();
      expect(service.cart()).toEqual([]);
      expect(service.selectedPayment()).toBeNull();
      expect(service.descuento()).toBe(0);
      expect(service.subtotal()).toBe(0);
      expect(service.total()).toBe(0);
    });

    // Verifica que el estado reaccione al agregar (hay items y subtotal > 0) y al eliminar (vacío).
    it('el estado cambia al agregar y al eliminar productos', () => {
      expect(service.cart()).toHaveLength(0);
      service.addToCart(makeProduct());
      expect(service.cart()).toHaveLength(1);
      expect(service.subtotal()).toBeGreaterThan(0);
      service.removeItem(service.cart()[0]);
      expect(service.cart()).toHaveLength(0);
      expect(service.subtotal()).toBe(0);
    });
  });

  describe('cantidades y stock', () => {
    const makeProduct = (overrides: Partial<SalesProduct> = {}): SalesProduct => ({
      id: 10,
      nombre: 'Bujía',
      descripcion: 'Desc',
      precio: 50,
      stock: 15,
      codigoBarras: '7501234567800',
      hasSucursalPrice: false,
      imagen: '',
      ...overrides,
    });

    // Verifica que todo producto recién agregado inicie con cantidad 1.
    it('la cantidad inicial al agregar es 1', () => {
      service.addToCart(makeProduct());
      expect(service.cart()[0].qty).toBe(1);
    });

    // Verifica que agregar repetidamente no supere el stock disponible.
    it('addToCart repetido respeta el tope de stock', () => {
      service.addToCart(makeProduct({ stock: 2 }));
      service.addToCart(makeProduct({ stock: 2 }));
      service.addToCart(makeProduct({ stock: 2 }));
      expect(service.cart()[0].qty).toBe(2);
    });

    // Verifica que increaseQty tampoco supere el stock disponible.
    it('increaseQty respeta el tope de stock', () => {
      service.addToCart(makeProduct({ stock: 1 }));
      service.increaseQty(service.cart()[0]);
      expect(service.cart()[0].qty).toBe(1);
    });

    // Verifica la validación existente: productos con stock negativo no entran al carrito.
    it('producto con stock negativo no se agrega (validación existente)', () => {
      service.addToCart(makeProduct({ stock: -3 }));
      expect(service.cart()).toHaveLength(0);
    });

    // Verifica la regla coherente del módulo: stock 0 significa sin existencias y no entra al carrito.
    it('producto con stock 0 no se agrega (sin existencias)', () => {
      // Coherente con product-card (botón deshabilitado en stock 0) y sales.page (bloquea stock <= 0).
      service.addToCart(makeProduct({ stock: 0 }));
      expect(service.cart()).toHaveLength(0);
      expect(service.subtotal()).toBe(0);
    });

    // Verifica que re-agregar con stock 1 nunca supere una unidad.
    it('re-agregar con stock 1 no supera el tope de 1', () => {
      service.addToCart(makeProduct({ stock: 1 }));
      service.addToCart(makeProduct({ stock: 1 }));
      service.addToCart(makeProduct({ stock: 1 }));
      expect(service.cart()).toHaveLength(1);
      expect(service.cart()[0].qty).toBe(1);
    });
  });

  describe('cálculos a través del servicio', () => {
    const makeProduct = (overrides: Partial<SalesProduct> = {}): SalesProduct => ({
      id: 1,
      nombre: 'P',
      descripcion: '',
      precio: 120,
      stock: 100,
      codigoBarras: '001',
      hasSucursalPrice: false,
      imagen: '',
      ...overrides,
    });

    // Verifica los valores exactos de subtotal, IVA y total para un producto de $120.
    it('calcula subtotal, IVA y total exactos para un producto (120 -> 120 / 19.2 / 139.2)', () => {
      service.addToCart(makeProduct({ precio: 120 }));
      expect(service.subtotal()).toBe(120);
      expect(service.iva()).toBeCloseTo(19.2, 10);
      expect(service.total()).toBeCloseTo(139.2, 10);
    });

    // Verifica los totales con varios productos y distintas cantidades (200 -> 32 -> 232).
    it('calcula totales con múltiples productos y cantidades', () => {
      service.addToCart(makeProduct({ id: 1, precio: 100, stock: 100 }));
      service.addToCart(makeProduct({ id: 2, precio: 50, stock: 100 }));
      service.addToCart(makeProduct({ id: 2, precio: 50, stock: 100 }));
      // subtotal = 100 + 50*2 = 200, iva = 32, total = 232
      expect(service.subtotal()).toBe(200);
      expect(service.iva()).toBeCloseTo(32, 10);
      expect(service.total()).toBeCloseTo(232, 10);
    });

    // Verifica los totales exactos con precios con centavos (subtotal redondeado a 2 decimales).
    it('calcula totales con precios con centavos', () => {
      service.addToCart(makeProduct({ id: 1, precio: 19.99, stock: 100 }));
      service.addToCart(makeProduct({ id: 1, precio: 19.99, stock: 100 }));
      service.addToCart(makeProduct({ id: 2, precio: 5.5, stock: 100 }));
      expect(service.subtotal()).toBe(45.48);
      expect(service.total()).toBeCloseTo(45.48 * 1.16, 2);
    });

    // Verifica que sin productos todos los totales del servicio sean cero.
    it('carrito vacío produce totales en cero', () => {
      expect(service.subtotal()).toBe(0);
      expect(service.iva()).toBe(0);
      expect(service.total()).toBe(0);
    });

    // Verifica que el subtotal de una línea equivalga a precio * cantidad con centavos exactos.
    it('el subtotal de cada línea es precio * cantidad', () => {
      service.addToCart(makeProduct({ id: 7, precio: 33.33, stock: 100 }));
      service.addToCart(makeProduct({ id: 7, precio: 33.33, stock: 100 }));
      service.addToCart(makeProduct({ id: 7, precio: 33.33, stock: 100 }));
      expect(service.subtotal()).toBe(99.99);
    });

    // Verifica que el subtotal nunca exponga artefactos float en el resumen (interpolación directa).
    it('el subtotal con 19.99 x 3 es exactamente 59.97', () => {
      service.addToCart(makeProduct({ id: 9, precio: 19.99, stock: 100 }));
      service.addToCart(makeProduct({ id: 9, precio: 19.99, stock: 100 }));
      service.addToCart(makeProduct({ id: 9, precio: 19.99, stock: 100 }));
      expect(service.subtotal()).toBe(59.97);
    });
  });

  describe('confirmSale - validaciones y estado', () => {
    const prod = (id: number, cantidadVeces = 1, precio = 100): SalesProduct => ({
      id,
      nombre: `P${id}`,
      descripcion: '',
      precio,
      stock: 50,
      codigoBarras: `00${id}`,
      hasSucursalPrice: false,
      imagen: '',
    });

    // Verifica que selectPayment almacene el método de pago elegido.
    it('selectPayment guarda el método seleccionado', () => {
      service.selectPayment({ id: 2, tipo: 'TARJETA', descripcion: 'Tarjeta' });
      expect(service.selectedPayment()).toEqual({ id: 2, tipo: 'TARJETA', descripcion: 'Tarjeta' });
    });

    // Verifica que el payload enviado al facade incluya cada producto con su cantidad real.
    it('mapea cada item con su cantidad real en el payload', (done) => {
      const spy = jest
        .spyOn(salesFacadeStub, 'createCompleteSale')
        .mockReturnValue(of({ id: 7 } as never));
      service.addToCart(prod(1));
      service.addToCart(prod(2));
      service.addToCart(prod(2));
      service.selectPayment({ id: 3, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

      service.confirmSale().subscribe({
        next: () => {
          expect(spy).toHaveBeenCalledWith({
            idMetodoPago: 3,
            productos: [
              { id: 1, cantidad: 1 },
              { id: 2, cantidad: 2 },
            ],
          });
          done();
        },
      });
    });

    // Verifica que tras una venta exitosa se limpie carrito y pago, y se recarguen las ventas.
    it('tras venta exitosa limpia carrito, pago y recarga ventas', (done) => {
      jest.spyOn(salesFacadeStub, 'createCompleteSale').mockReturnValue(of({ id: 5 } as never));
      const loadSpy = jest.spyOn(salesFacadeStub, 'loadSales');
      service.addToCart(prod(1));
      service.selectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

      service.confirmSale().subscribe({
        next: () => {
          expect(service.cart()).toEqual([]);
          expect(service.selectedPayment()).toBeNull();
          expect(service.total()).toBe(0);
          expect(loadSpy).toHaveBeenCalled();
          done();
        },
      });
    });

    // Verifica que si el backend falla el carrito se conserve y el error se propague al suscriptor.
    it('si el backend falla, el carrito NO se limpia y el error se propaga', (done) => {
      jest
        .spyOn(salesFacadeStub, 'createCompleteSale')
        .mockReturnValue(throwError(() => new Error('Stock insuficiente')));
      service.addToCart(prod(1));
      service.selectPayment({ id: 1, tipo: 'EFECTIVO', descripcion: 'Efectivo' });

      service.confirmSale().subscribe({
        error: (err) => {
          expect(err.message).toBe('Stock insuficiente');
          expect(service.cart()).toHaveLength(1);
          done();
        },
      });
    });
  });

  describe('funciones auxiliares', () => {
    // Verifica que setVentaInventarioId sea no-op: no lanza y no modifica el carrito.
    it('setVentaInventarioId es no-op: no lanza y no altera el carrito', () => {
      service.addToCart({
        id: 1, nombre: 'P1', descripcion: '', precio: 10, stock: 5,
        codigoBarras: '001', hasSucursalPrice: false, imagen: '',
      });
      expect(() => service.setVentaInventarioId(123)).not.toThrow();
      expect(() => service.setVentaInventarioId(null)).not.toThrow();
      expect(service.cart()).toHaveLength(1);
    });

    // Verifica que el computed order refleje los items actuales del carrito.
    it('order computed refleja los items del carrito', () => {
      service.addToCart({
        id: 1, nombre: 'P1', descripcion: '', precio: 100, stock: 10,
        codigoBarras: '001', hasSucursalPrice: false, imagen: '',
      });
      const order = service.order();
      expect(order.items).toHaveLength(1);
      expect(order.subtotal.value).toBe(100);
    });
  });
});
