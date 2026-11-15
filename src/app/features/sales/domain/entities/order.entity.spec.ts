import { Order, OrderItem } from './order.entity';

describe('OrderItem', () => {
  // Verifica que el subtotal de una línea se calcule como precio * cantidad.
  it('calcula el subtotal como precio * cantidad', () => {
    const item = new OrderItem({ productId: 1, price: 120, quantity: 2 });
    expect(item.subtotal.value).toBe(240);
  });

  // Verifica que el subtotal soporte precios con centavos.
  it('calcula subtotal con precio con centavos', () => {
    const item = new OrderItem({ productId: 1, price: 19.99, quantity: 3 });
    expect(item.subtotal.value).toBeCloseTo(59.97, 2);
  });

  // Verifica que un precio negativo sea rechazado vía la validación de Money.
  it('lanza error si el precio es negativo (Money)', () => {
    expect(() => new OrderItem({ productId: 1, price: -5, quantity: 1 })).toThrow(
      'OrderItem.price: money must be a non-negative number',
    );
  });

  // Verifica que una cantidad cero sea rechazada vía la validación de Quantity.
  it('lanza error si la cantidad es cero (Quantity)', () => {
    expect(() => new OrderItem({ productId: 1, price: 10, quantity: 0 })).toThrow(
      'OrderItem.quantity: quantity must be greater than zero',
    );
  });

  // Verifica que una cantidad negativa sea rechazada vía la validación de Quantity.
  it('lanza error si la cantidad es negativa (Quantity)', () => {
    expect(() => new OrderItem({ productId: 1, price: 10, quantity: -2 })).toThrow(
      'OrderItem.quantity: quantity must be greater than zero',
    );
  });
});

describe('Order - estado inicial', () => {
  // Verifica que una orden recién creada no tenga items y todos sus totales en cero.
  it('inicia con items vacíos y totales en cero', () => {
    const order = new Order();
    expect(order.items).toHaveLength(0);
    expect(order.subtotal.value).toBe(0);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que validar una orden vacía lance el error de carrito vacío.
  it('validate lanza error con carrito vacío', () => {
    const order = new Order();
    expect(() => order.validate()).toThrow('El carrito está vacío.');
  });

  // Verifica que validar una orden con al menos un item no lance ningún error.
  it('validate no lanza error cuando hay items', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 1 });
    expect(() => order.validate()).not.toThrow();
  });
});

describe('Order - addItem', () => {
  // Verifica que se pueda agregar un producto nuevo conservando sus datos.
  it('agrega un producto nuevo', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    expect(order.items).toHaveLength(1);
    expect(order.items[0].productId).toBe(1);
    expect(order.items[0].quantity.value).toBe(1);
  });

  // Verifica que agregar el mismo producto acumule cantidad en una sola línea.
  it('acumula cantidad al agregar el mismo producto', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.addItem({ productId: 1, price: 100, quantity: 2 });
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity.value).toBe(3);
  });

  // Verifica que productos distintos generen líneas separadas.
  it('mantiene líneas separadas para productos distintos', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.addItem({ productId: 2, price: 50, quantity: 1 });
    expect(order.items).toHaveLength(2);
  });

  // Verifica que la cantidad acumulada de una línea nunca supere 999.
  it('topa la cantidad acumulada en 999', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 998 });
    order.addItem({ productId: 1, price: 10, quantity: 5 });
    expect(order.items[0].quantity.value).toBe(999);
  });

  // Verifica que agregar un item con cantidad inválida propague el error de Quantity.
  it('lanza error si la cantidad agregada es inválida', () => {
    const order = new Order();
    expect(() => order.addItem({ productId: 1, price: 10, quantity: 0 })).toThrow(
      'OrderItem.quantity: quantity must be greater than zero',
    );
  });
});

describe('Order - cálculos', () => {
  // El precio no incluye IVA: subtotal = suma de líneas, IVA 16 % encima, igual que el backend.
  it('el IVA se suma al subtotal (precio 120 -> subtotal 120, IVA 19.20, total 139.20)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 120, quantity: 1 });
    expect(order.subtotal.value).toBe(120);
    expect(order.iva.value).toBe(19.2);
    expect(order.total.value).toBe(139.2);
  });

  // Verifica el total sumando varias líneas con distintas cantidades.
  it('calcula total con múltiples productos (subtotal 250, IVA 40, total 290)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 2 });
    order.addItem({ productId: 2, price: 50, quantity: 1 });
    expect(order.subtotal.value).toBe(250);
    expect(order.iva.value).toBe(40);
    expect(order.total.value).toBe(290);
  });

  // Verifica el total exacto con precios con centavos (redondeo a 2 decimales).
  it('calcula total con precios con centavos', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 2 });
    order.addItem({ productId: 2, price: 5.5, quantity: 1 });
    expect(order.subtotal.value).toBe(45.48);
    expect(order.total.value).toBe(52.76);
  });

  // Verifica que el total se redondee a centavos exactos (sin artefactos float como 59.9699...).
  it('total redondea a centavos exactos (19.99 x 3 = 59.97 + 9.60 = 69.57)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 3 });
    expect(order.subtotal.value).toBe(59.97);
    expect(order.iva.value).toBe(9.6);
    expect(order.total.value).toBe(69.57);
  });

  // Verifica que una orden vacía produzca todos los totales en cero.
  it('carrito vacío produce totales en cero', () => {
    const order = new Order();
    expect(order.subtotal.value).toBe(0);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que el caso clásico 0.1 + 0.2 produzca valores exactos a nivel centavos.
  it('caso clásico 0.1 + 0.2: subtotal 0.3 y desglose exacto', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 0.1, quantity: 1 });
    order.addItem({ productId: 2, price: 0.2, quantity: 1 });
    expect(order.subtotal.value).toBe(0.3);
    expect(order.iva.value).toBe(0.05);
    expect(order.total.value).toBe(0.35);
  });
});

