import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, finalize, Observable, of, Subscription } from 'rxjs';

import { LoggerService } from '@core/logging/logger.service';
import { PaginationParams } from '@core/models/pagination.model';
import { GetProductsUseCase } from '../usecase/get-products.usecase';
import { GetProductsByCategoryUseCase } from '../usecase/get-products-by-category.usecase';
import { SearchProductsUseCase } from '../usecase/search-products.usecase';
import { CreateProductUseCase } from '../usecase/create-product.usecase';
import { UpdateProductUseCase } from '../usecase/update-product.usecase';
import { DeleteProductUseCase } from '../usecase/delete-product.usecase';
import { Product } from '../../domain/entities/product.entity';
import { CreateProductPayload, UpdateProductPayload } from '../../domain/repository/product-repository';

export type ProductFilter = 
  | { type: 'all' }
  | { type: 'category'; categoryName: string }
  | { type: 'search'; query: string };

@Injectable({ providedIn: 'root' })
export class InventoryFacade {
  private readonly getProductsUseCase = inject(GetProductsUseCase);
  private readonly getProductsByCategoryUseCase = inject(GetProductsByCategoryUseCase);
  private readonly searchProductsUseCase = inject(SearchProductsUseCase);
  private readonly deleteProductUseCase = inject(DeleteProductUseCase);
  private readonly createProductUseCase = inject(CreateProductUseCase);
  private readonly updateProductUseCase = inject(UpdateProductUseCase);
  private readonly logger = inject(LoggerService).withContext('InventoryFacade');

  private readonly _products = signal<readonly Product[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);
  
  private readonly _totalItems = signal(0);
  private readonly _currentPage = signal(1);
  private readonly _pageSize = signal(15);
  private readonly _productFilter = signal<ProductFilter>({ type: 'all' });
  private _fetchSubscription?: Subscription;

  readonly products = this._products.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly totalItems = this._totalItems.asReadonly();
  readonly currentPage = this._currentPage.asReadonly();
  readonly pageSize = this._pageSize.asReadonly();
  readonly productFilter = this._productFilter.asReadonly();

  loadProducts(pageIndex: number = 1, append: boolean = false): void {
    this._productFilter.set({ type: 'all' });
    this.fetchProducts(this._productFilter(), pageIndex, append);
  }

  loadProductsByCategoria(categoria: string, pageIndex: number = 1, append: boolean = false): void {
    const filter: ProductFilter = { type: 'category', categoryName: categoria };
    this._productFilter.set(filter);
    this.fetchProducts(filter, pageIndex, append);
  }

  searchProducts(query: string, pageIndex: number = 1, append: boolean = false): void {
    if (!query.trim()) {
      this.loadProducts(1, false);
      return;
    }
    const filter: ProductFilter = { type: 'search', query };
    this._productFilter.set(filter);
    this.fetchProducts(filter, pageIndex, append);
  }

  private fetchProducts(filter: ProductFilter, pageIndex: number, append: boolean): void {
    // Cancel any pending request before starting a new one
    this._fetchSubscription?.unsubscribe();

    this._loading.set(true);
    this._errorMessage.set(null);

    if (!append) {
      this._products.set([]);
      this._totalItems.set(0);
      this._currentPage.set(1);
    }

    const limit = this._pageSize();
    const params: PaginationParams = { page: pageIndex, limit };

    let useCase$;
    
    switch (filter.type) {
      case 'category':
        useCase$ = this.getProductsByCategoryUseCase.execute(filter.categoryName, params);
        break;
      case 'search':
        useCase$ = this.searchProductsUseCase.execute(filter.query, params);
        break;
      default:
        useCase$ = this.getProductsUseCase.execute(params);
        break;
    }

    this._fetchSubscription = useCase$
      .pipe(
        catchError((error: unknown) => {
          const message = this.resolveErrorMessage(error);
          this._errorMessage.set(message);
          this.logger.error('Failed to load products', { message, page: pageIndex, filter });
          return of({ data: [], total: this._totalItems(), page: pageIndex, limit });
        }),
        finalize(() => {
          this._loading.set(false);
        }),
      )
      .subscribe((response) => {
        if (append) {
          this._products.update((current) => [...current, ...response.data]);
        } else {
          this._products.set(response.data);
        }
        
        this._totalItems.set(response.total);
        this._currentPage.set(response.page);
        this._pageSize.set(response.limit);
      });
  }

  loadMore(): void {
    const nextPage = this._currentPage() + 1;
    const totalLoaded = this._products().length;

    if (totalLoaded < this._totalItems()) {
      this.fetchProducts(this._productFilter(), nextPage, true);
    }
  }

  deleteProduct(id: number): Observable<void> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.deleteProductUseCase.execute(id).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to delete product', { message, id });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  createProduct(payload: CreateProductPayload): Observable<Product> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.createProductUseCase.execute(payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to create product', { message, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  updateProduct(id: number, payload: UpdateProductPayload): Observable<Product> {
    this._loading.set(true);
    this._errorMessage.set(null);

    return this.updateProductUseCase.execute(id, payload).pipe(
      catchError((error: unknown) => {
        const message = this.resolveErrorMessage(error);
        this._errorMessage.set(message);
        this.logger.error('Failed to update product', { message, id, payload });
        throw error;
      }),
      finalize(() => {
        this._loading.set(false);
      }),
    );
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return error.message || 'No fue posible cargar los productos.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No fue posible cargar los productos.';
  }
}
