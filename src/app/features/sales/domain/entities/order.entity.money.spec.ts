import { Order, OrderItem } from './order.entity';

// Complementa order.entity.spec.ts: redondeo a centavos, IVA 16 %, descuentos con decimales y casos límite.
describe('OrderItem - redondeo del subtotal', () => {
  // Verifica que un precio de 1 centavo con cantidad 1 conserve el centavo.
  it('subtotal de un centavo se conserva', () => {
    expect(new OrderItem({ productId: 1, price: 0.01, quantity: 1 }).subtotal.value).toBe(0.01);
  });

  // Verifica que el subtotal sea exacto en centavos para precios típicos x cantidades enteras.
  it('subtotal exacto en centavos para precios y cantidades enteras', () => {
    for (let cents = 1; cents <= 2000; cents++) {
      for (const quantity of [1, 2, 3, 7, 13, 100]) {
        const item = new OrderItem({ productId: 1, price: cents / 100, quantity });
        expect(item.subtotal.value).toBe((cents * quantity) / 100);
      }
    }
  });

  // Verifica que un precio cero produzca subtotal cero (producto gratis / regalo).
  it('precio cero produce subtotal cero', () => {
    expect(new OrderItem({ productId: 1, price: 0, quantity: 5 }).subtotal.value).toBe(0);
  });

  // Verifica el subtotal con el máximo de unidades (999) y un precio alto.
  it('calcula subtotal con cantidad 999 y precio alto', () => {
    const item = new OrderItem({ productId: 1, price: 999999.99, quantity: 999 });
    expect(item.subtotal.value).toBe(998999990.01);
  });

  // H-12: el subtotal usa toFixed(2) sobre un double; con cantidades fraccionarias el medio centavo
  // cae del lado equivocado (0.15 x 1.5 = 0.225 debería redondear a 0.23 y da 0.22).
  it.todo('H-12: OrderItem.subtotal redondea mal el medio centavo con cantidad fraccionaria (0.15 x 1.5 -> 0.22, esperado 0.23)');
  it.todo('H-12: OrderItem.subtotal redondea mal el medio centavo con cantidad fraccionaria (0.01 x 1.5 -> 0.01, esperado 0.02)');
});

describe('Order - IVA 16 % y redondeo', () => {
  // Verifica que el IVA de un precio bajo se redondee hacia arriba al centavo (0.04 -> 0.0064 -> 0.01).
  it('redondea el IVA hacia arriba al centavo (0.04 -> 0.01)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 0.04, quantity: 1 });
    expect(order.iva.value).toBe(0.01);
    expect(order.total.value).toBe(0.05);
  });

  // Verifica que un IVA menor a medio centavo se redondee a cero (0.03 -> 0.0048 -> 0.00).
  it('redondea el IVA hacia abajo cuando es menor a medio centavo (0.03 -> 0.00)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 0.03, quantity: 1 });
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0.03);
  });

  // Verifica que 99.99 tenga IVA 15.9984 -> 16.00 y total 115.99.
  it('99.99 -> IVA 16.00 y total 115.99', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 99.99, quantity: 1 });
    expect(order.iva.value).toBe(16);
    expect(order.total.value).toBe(115.99);
  });

  // Verifica la terna completa con el caso 19.99 x 3: subtotal 59.97, IVA 9.60, total 69.57.
  it('19.99 x 3 -> subtotal 59.97, IVA 9.60, total 69.57', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 3 });
    expect(order.subtotal.value).toBe(59.97);
    expect(order.iva.value).toBe(9.6);
    expect(order.total.value).toBe(69.57);
  });

  // Verifica que, para cualquier subtotal en centavos, IVA y total sean exactos al centavo y consistentes.
  it('IVA y total son exactos en centavos para subtotales de 0.00 a 50.00', () => {
    for (let cents = 0; cents <= 5000; cents++) {
      const order = new Order();
      if (cents > 0) order.addItem({ productId: 1, price: cents / 100, quantity: 1 });

      const ivaCents = Math.round((cents * 16) / 100);
      expect(order.iva.value).toBe(ivaCents / 100);
      expect(order.total.value).toBe((cents + ivaCents) / 100);
    }
  });

  // Verifica que el total con montos grandes (999 x 999999.99) siga siendo exacto al centavo.
  it('calcula IVA y total con montos muy grandes', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 999999.99, quantity: 999 });
    expect(order.subtotal.value).toBe(998999990.01);
    expect(order.iva.value).toBe(159839998.4);
    expect(order.total.value).toBe(1158839988.41);
  });

  // Verifica que consultar los getters varias veces no cambie el resultado (sin estado oculto).
  it('los getters son idempotentes', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 3 });
    const first = order.total.value;
    expect(order.total.value).toBe(first);
    expect(order.total.value).toBe(first);
  });
});

describe('Order - descuento con decimales', () => {
  // Verifica que un descuento con centavos reduzca la base antes del IVA (100 - 10.50 = 89.50).
  it('descuento de 10.50 sobre 100 -> IVA 14.32 y total 103.82', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(10.5);
    expect(order.discount.value).toBe(10.5);
    expect(order.iva.value).toBe(14.32);
    expect(order.total.value).toBe(103.82);
  });

  // Verifica que el resultado con descuento 33.33 sea exacto al centavo (base 66.67).
  it('descuento de 33.33 sobre 100 -> IVA 10.67 y total 77.34', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(33.33);
    expect(order.iva.value).toBe(10.67);
    expect(order.total.value).toBe(77.34);
  });

  // Verifica que un descuento igual al subtotal deje IVA y total en cero.
  it('descuento igual al subtotal deja IVA y total en cero', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 50, quantity: 2 });
    order.setDiscount(100);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que el descuento no modifique el subtotal (solo afecta base de IVA y total).
  it('el descuento no altera el subtotal', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(40);
    expect(order.subtotal.value).toBe(100);
  });

  // Verifica que el getter discount devuelva el monto tal cual aunque supere el subtotal (sin tope).
  it('discount devuelve el monto configurado aunque supere el subtotal', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 1 });
    order.setDiscount(500);
    expect(order.discount.value).toBe(500);
  });

  // Verifica que un segundo setDiscount reemplace al primero (no se acumulan).
  it('el último descuento reemplaza al anterior', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(10);
    order.setDiscount(20);
    expect(order.discount.value).toBe(20);
    expect(order.total.value).toBe(92.8);
  });

  // Verifica que aplicar descuento a un carrito vacío no genere totales negativos.
  it('descuento sobre carrito vacío deja totales en cero', () => {
    const order = new Order();
    order.setDiscount(25);
    expect(order.subtotal.value).toBe(0);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que el descuento se aplique sobre el subtotal actual si se agregan items después.
  it('el descuento previo se aplica a items agregados después', () => {
    const order = new Order();
    order.setDiscount(10);
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    expect(order.total.value).toBe(104.4);
  });

  // setDiscount solo valida < 0: NaN e Infinity pasan y luego revientan los getters (discount/iva/total).
  it.todo('H-23: Order.setDiscount(NaN) no lanza (order.entity.ts:54-57); después order.discount/iva/total lanzan "money must be a non-negative number"');
  it.todo('H-23: Order.setDiscount(Infinity) no lanza (order.entity.ts:54-57); después order.discount lanza "money must be a non-negative number"');
});

describe('Order - addItem (casos límite)', () => {
  // Verifica que al acumular la misma línea se use el precio del último addItem.
  it('la línea acumulada toma el precio del último addItem', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 1 });
    order.addItem({ productId: 1, price: 12, quantity: 1 });
    expect(order.items).toHaveLength(1);
    expect(order.items[0].price.value).toBe(12);
    expect(order.items[0].quantity.value).toBe(2);
    expect(order.subtotal.value).toBe(24);
  });

  // Verifica que una línea ya en 999 se mantenga en 999 al agregar una unidad más.
  it('una línea en 999 no pasa de 999', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 999 });
    order.addItem({ productId: 1, price: 10, quantity: 1 });
    expect(order.items[0].quantity.value).toBe(999);
  });

  // Verifica que el tope 999 de una línea no afecte a otras líneas del carrito.
  it('el tope de una línea no afecta a las otras', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 998 });
    order.addItem({ productId: 2, price: 5, quantity: 2 });
    order.addItem({ productId: 1, price: 10, quantity: 10 });
    expect(order.items[0].quantity.value).toBe(999);
    expect(order.items[1].quantity.value).toBe(2);
  });

  // Verifica que dos órdenes no compartan estado interno.
  it('dos órdenes son independientes', () => {
    const a = new Order();
    const b = new Order();
    a.addItem({ productId: 1, price: 10, quantity: 1 });
    a.setDiscount(5);
    expect(b.items).toHaveLength(0);
    expect(b.discount.value).toBe(0);
  });

  // Verifica que un precio negativo en el segundo addItem de la misma línea sea rechazado.
  it('rechaza precio negativo al acumular una línea existente', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 1 });
    expect(() => order.addItem({ productId: 1, price: -1, quantity: 1 })).toThrow(
      'OrderItem.price: money must be a non-negative number',
    );
  });

  // El tope de 999 solo se aplica al acumular; una línea nueva con quantity > 999 pasa sin topar.
  it.todo('H-24: Order.addItem({ quantity: 1500 }) en producto nuevo no se topa en 999 (order.entity.ts:62-66, el tope solo aplica al acumular)');
});
