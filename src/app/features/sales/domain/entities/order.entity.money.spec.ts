import { Order, OrderItem } from './order.entity';

// Complementa order.entity.spec.ts: redondeo a centavos, IVA 16 % incluido, descuentos con decimales y casos límite.
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
  it('H-12: redondea el medio centavo hacia arriba con cantidad fraccionaria (0.15 x 1.5 -> 0.23)', () => {
    expect(new OrderItem({ productId: 1, price: 0.15, quantity: 1.5 }).subtotal.value).toBe(0.23);
  });

  it('H-12: redondea el medio centavo hacia arriba con cantidad fraccionaria (0.01 x 1.5 -> 0.02)', () => {
    expect(new OrderItem({ productId: 1, price: 0.01, quantity: 1.5 }).subtotal.value).toBe(0.02);
  });
});

describe('Order - IVA 16 % incluido y redondeo', () => {
  // Verifica el desglose de un precio bajo: 0.04 -> subtotal 0.03 e IVA 0.01.
  it('desglosa el IVA incluido de 0.04 (subtotal 0.03, IVA 0.01)', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 0.04, quantity: 1 });
    expect(order.total.value).toBe(0.04);
    expect(order.subtotal.value).toBe(0.03);
    expect(order.iva.value).toBe(0.01);
  });

  // Verifica que el IVA incluido de 0.03 se redondee a cero.
  it('0.03 -> subtotal 0.03 e IVA 0.00', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 0.03, quantity: 1 });
    expect(order.total.value).toBe(0.03);
    expect(order.subtotal.value).toBe(0.03);
    expect(order.iva.value).toBe(0);
  });

  // Verifica que 99.99 conserve el total y se desglose en 86.20 + 13.79.
  it('99.99 -> total 99.99, subtotal 86.20 e IVA 13.79', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 99.99, quantity: 1 });
    expect(order.total.value).toBe(99.99);
    expect(order.subtotal.value).toBe(86.2);
    expect(order.iva.value).toBe(13.79);
  });

  // Verifica la terna completa con el caso 19.99 x 3: total 59.97, subtotal 51.70, IVA 8.27.
  it('19.99 x 3 -> total 59.97, subtotal 51.70, IVA 8.27', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 19.99, quantity: 3 });
    expect(order.total.value).toBe(59.97);
    expect(order.subtotal.value).toBe(51.7);
    expect(order.iva.value).toBe(8.27);
  });

  // Verifica que, para cualquier total en centavos, subtotal + IVA sumen exactamente el total.
  it('subtotal + IVA = total exacto en centavos para totales de 0.00 a 50.00', () => {
    for (let cents = 0; cents <= 5000; cents++) {
      const order = new Order();
      if (cents > 0) order.addItem({ productId: 1, price: cents / 100, quantity: 1 });

      const subtotalCents = Math.round(cents / 1.16);
      expect(order.total.value).toBe(cents / 100);
      expect(order.subtotal.value).toBe(subtotalCents / 100);
      expect(order.iva.value).toBe((cents - subtotalCents) / 100);
    }
  });

  // Verifica que el desglose con montos grandes (999 x 999999.99) siga siendo exacto al centavo.
  it('calcula el desglose con montos muy grandes', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 999999.99, quantity: 999 });
    expect(order.total.value).toBe(998999990.01);
    expect(order.subtotal.value).toBe(861206887.94);
    expect(order.iva.value).toBe(137793102.07);
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
  // Verifica que un descuento con centavos se reste del total (100 - 10.50 = 89.50).
  it('descuento de 10.50 sobre 100 -> total 89.50, subtotal 77.16 e IVA 12.34', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(10.5);
    expect(order.discount.value).toBe(10.5);
    expect(order.total.value).toBe(89.5);
    expect(order.subtotal.value).toBe(77.16);
    expect(order.iva.value).toBe(12.34);
  });

  // Verifica que el resultado con descuento 33.33 sea exacto al centavo (total 66.67).
  it('descuento de 33.33 sobre 100 -> total 66.67, subtotal 57.47 e IVA 9.20', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(33.33);
    expect(order.total.value).toBe(66.67);
    expect(order.subtotal.value).toBe(57.47);
    expect(order.iva.value).toBe(9.2);
  });

  // Verifica que un descuento igual al total deje subtotal, IVA y total en cero.
  it('descuento igual al total deja subtotal, IVA y total en cero', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 50, quantity: 2 });
    order.setDiscount(100);
    expect(order.subtotal.value).toBe(0);
    expect(order.iva.value).toBe(0);
    expect(order.total.value).toBe(0);
  });

  // Verifica que el descuento reduzca el total (100 - 40 = 60, subtotal 51.72, IVA 8.28).
  it('el descuento reduce el total y su desglose', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 100, quantity: 1 });
    order.setDiscount(40);
    expect(order.total.value).toBe(60);
    expect(order.subtotal.value).toBe(51.72);
    expect(order.iva.value).toBe(8.28);
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
    expect(order.total.value).toBe(80);
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
    expect(order.total.value).toBe(90);
  });

  // setDiscount solo valida < 0: NaN e Infinity pasan y luego revientan los getters (discount/iva/total).
  it('H-23: setDiscount(NaN) lanza y no deja la orden en estado inválido', () => {
    const order = new Order();
    expect(() => order.setDiscount(NaN)).toThrow('Discount must be a finite number');
    expect(order.discount.value).toBe(0);
  });

  it('H-23: setDiscount(Infinity) lanza y no deja la orden en estado inválido', () => {
    const order = new Order();
    expect(() => order.setDiscount(Infinity)).toThrow('Discount must be a finite number');
    expect(order.total.value).toBe(0);
  });
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
    expect(order.total.value).toBe(24);
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
  it('H-24: el tope de 999 también aplica a un producto nuevo', () => {
    const order = new Order();
    order.addItem({ productId: 1, price: 10, quantity: 1500 });
    expect(order.items[0].quantity.value).toBe(999);
  });
});
