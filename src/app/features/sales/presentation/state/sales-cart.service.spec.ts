import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SessionStateService } from '@features/auth/application/services/session-state.service';
import { SalesFacade } from '@features/sales/application/facades/sales.facade';
import { SalesCartService } from './sales-cart.service';
import { SalesProduct } from '../models/sales-ui.models';

describe('SalesCartService', () => {
  let service: SalesCartService;
  const salesFacadeStub = {
    createSale: () => of(void 0),
    loadSales: () => void 0,
  };
  const sessionStateStub = {
    getSession: () => ({ userId: '1' }),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SalesCartService,
        { provide: SalesFacade, useValue: salesFacadeStub },
        { provide: SessionStateService, useValue: sessionStateStub },
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
});
