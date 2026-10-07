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
    expect(order.discount.value).toBe(0);
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
  // Verifica el subtotal exacto para un solo producto con cantidad 1.
  it('calcula subtotal de un solo producto', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 120, quantity: 1 });
    expect(order.subtotal.value).toBe(120);
  });

  // Verifica el subtotal sumando varias líneas con distintas cantidades.
  it('calcula subtotal con múltiples productos y cantidades', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 2 });
    order.addItem({ productId: 2, price: 50, quantity: 3 });
    expect(order.subtotal.value).toBe(350);
  });

  // Verifica el subtotal exacto con precios con centavos (redondeo a 2 decimales).
  it('calcula subtotal con precios con centavos', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 2 });
    order.addItem({ productId: 2, price: 5.5, quantity: 1 });
    expect(order.subtotal.value).toBe(45.48);
  });

  // Verifica que el subtotal se redondee a centavos exactos (sin artefactos float como 59.9699...).
  it('subtotal redondea a centavos exactos (19.99 x 3 = 59.97)', () => {
    // Antes del fix, 19.99 * 3 en IEEE 754 producía 59.96999999999999 y se mostraba así en el resumen.
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 3 });
    expect(order.subtotal.value).toBe(59.97);
    expect(Number.isInteger(order.subtotal.value * 100)).toBe(true);
  });

  // Verifica que el IVA sea el 16% del subtotal cuando no hay descuento.
  it('calcula IVA del 16% sobre el subtotal', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    expect(order.iva.value).toBeCloseTo(16, 10);
  });

  // Verifica la terna completa subtotal/IVA/total para un caso conocido (120 -> 139.2).
  it('calcula total como base + IVA (precio 120 -> total 139.2)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 120, quantity: 1 });
    expect(order.subtotal.value).toBe(120);
    expect(order.iva.value).toBeCloseTo(19.2, 10);
    expect(order.total.value).toBeCloseTo(139.2, 10);
  });

  // Verifica subtotal/IVA/total con múltiples productos (250 -> 40 -> 290).
  it('calcula total con múltiples productos', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 2 });
    order.addItem({ productId: 2, price: 50, quantity: 1 });
    // subtotal 250, iva 40, total 290
    expect(order.subtotal.value).toBe(250);
    expect(order.iva.value).toBeCloseTo(40, 10);
    expect(order.total.value).toBeCloseTo(290, 10);
  });

  // Verifica que una orden vacía produzca todos los totales en cero.
  it('carrito vacío produce totales en cero', () => {
    const order = new Order();
    expect(order.subtotal.value).toBe(0);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que el caso clásico 0.1 + 0.2 produzca valores exactos a nivel centavos.
  it('caso clásico 0.1 + 0.2: subtotal 0.3 e IVA/total exactos', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 0.1, quantity: 1 });
    order.addItem({ productId: 2, price: 0.2, quantity: 1 });
    expect(order.subtotal.value).toBe(0.3);
    expect(order.iva.value).toBe(0.05);
    expect(order.total.value).toBe(0.35);
  });
});

describe('Order - descuento', () => {
  // Verifica que el descuento reduzca la base sobre la que se calculan IVA y total.
  it('descuento reduce la base del IVA y del total', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(10);
    expect(order.discount.value).toBe(10);
    expect(order.iva.value).toBeCloseTo(14.4, 10);
    expect(order.total.value).toBeCloseTo(104.4, 10);
  });

  // Verifica que un descuento mayor al subtotal no genere totales negativos (base en cero).
  it('descuento mayor al subtotal deja base en cero (sin negativos)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 50, quantity: 1 });
    order.setDiscount(100);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que un descuento negativo sea rechazado con error.
  it('descuento negativo lanza error', () => {
    const order = new Order();
    expect(() => order.setDiscount(-1)).toThrow('Discount cannot be negative');
  });

  // Verifica que un descuento cero sea válido y no altere los totales.
  it('descuento cero es válido', () => {
    const order = new Order();
    expect(() => order.setDiscount(0)).not.toThrow();
    expect(order.discount.value).toBe(0);
  });
});
