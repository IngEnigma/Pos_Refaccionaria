import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';


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
    it('throws error if cart is empty', (done) => {
      service.confirmSale().subscribe({
        error: (err) => {
          expect(err.message).toBe('El carrito está vacío.');
          done();
        },
      });
    });

    it('throws error if no payment method selected', (done) => {
      service.addToCart({ id: 1, nombre: 'Test', precio: 10, stock: 5, codigoBarras: '001', hasSucursalPrice: false, imagen: '', descripcion: '' });
      service.confirmSale().subscribe({
        error: (err) => {
          expect(err.message).toBe('Selecciona un método de pago.');
          done();
        },
      });
    });

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
});
