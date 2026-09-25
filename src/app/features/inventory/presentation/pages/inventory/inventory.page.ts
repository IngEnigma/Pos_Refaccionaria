import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { ToastService } from '@shared/ui/components/toast/toast.service';
import { ConfirmDialogComponent } from '@shared/ui/components/confirm-dialog/confirm-dialog.component';
import { GlobalSearchService } from '@app/core/search/global-search.service';
import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { InventoryFacade } from '@app/features/inventory/application/facades/inventory.facade';
import { InventoryByBranchFacade } from '@features/inventory-by-branch';
import { BranchPricingFacade } from '@features/branch-pricing/application/facades/branch-pricing.facade';
import { SalesFacade, ProductTypesFacade, ProductType } from '@app/features/sales';
import { CategorySliderComponent } from '@app/features/sales/presentation/components/category-slider/category-slider.component';
import { InventoryProductGridComponent } from '../../components/inventory-product-grid/inventory-product-grid.component';
import { ProductFormDialogComponent } from '../../components/product-form-dialog/product-form-dialog.component';
import { SetPriceDialogComponent } from '@features/branch-pricing/presentation/components/set-price-dialog/set-price-dialog.component';
import { InventoryItem } from '@features/inventory-by-branch/domain/entities/inventory-item.entity';
import { Product } from '../../../domain/entities/product.entity';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategorySliderComponent,
    InventoryProductGridComponent,
    LucideAngularModule,
    DialogModule
  ],
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPageComponent {
  readonly authFacade = inject(AuthFacade);
  readonly productTypesFacade = inject(ProductTypesFacade);
  readonly inventoryFacade = inject(InventoryFacade);
  readonly inventoryByBranchFacade = inject(InventoryByBranchFacade);
  readonly branchPricingFacade = inject(BranchPricingFacade);
  readonly toastService = inject(ToastService);
  private readonly dialog = inject(Dialog);

  readonly loadingCategories = computed(() => this.productTypesFacade.loading());
  // mi-sucursal como fuente (reemplaza /productos)
  readonly loadingProducts = computed(() => this.inventoryByBranchFacade.loading());

  // Paginación cliente sobre mi-sucursal
  readonly pageSize = 15;
  readonly currentPage = signal(1);

  readonly categories = computed<ProductType[]>(() => [
    this.defaultCategory,
    ...this.productTypesFacade.productTypes(),
  ]);
  readonly selectedCategoryId = signal<number | null>(null);

  private readonly globalSearchService = inject(GlobalSearchService);
  readonly searchQuery = this.globalSearchService.searchQuery;

  private readonly defaultCategory: ProductType = { id: 0, nombre: 'Todos' };

  // Items filtrados (mi-sucursal) + búsqueda
  readonly filteredItems = computed<readonly InventoryItem[]>(() => {
    const all = this.inventoryByBranchFacade.allItems() as readonly InventoryItem[];
    const query = this.searchQuery().trim().toLowerCase();
    const catId = this.selectedCategoryId();
    let filtered = all;

    if (query) {
      filtered = filtered.filter(
        (it) =>
          it.nombre.toLowerCase().includes(query) ||
          it.clave.toLowerCase().includes(query) ||
          it.codigoBarras.toLowerCase().includes(query) ||
          it.marca.toLowerCase().includes(query)
      );
    }
    // Nota: filtro por categoría no aplica a InventoryItem (sin id_tipo), se mantiene slider pero no filtra
    void catId;
    return filtered;
  });

  readonly totalItems = computed(() => this.filteredItems().length);

  readonly paginatedProducts = computed(() => {
    const filtered = this.filteredItems();
    const end = this.currentPage() * this.pageSize;
    return filtered.slice(0, end);
  });

  readonly hasMore = computed(() => this.paginatedProducts().length < this.totalItems());

  constructor() {
    effect(() => {
      const errorMsg = this.inventoryByBranchFacade.errorMessage();
      if (errorMsg) this.toastService.error(errorMsg);
    });

    effect(() => {
      const errorMsg = this.inventoryFacade.errorMessage();
      if (errorMsg) this.toastService.error(errorMsg);
    });

    effect(() => {
      const errorMsg = this.productTypesFacade.errorMessage();
      if (errorMsg) this.toastService.error(errorMsg);
    });

    effect(() => {
      const errorMsg = this.branchPricingFacade.errorMessage();
      if (errorMsg) this.toastService.error(errorMsg);
    });

    // Reset paginación al cambiar búsqueda
    effect(() => {
      this.searchQuery();
      untracked(() => this.currentPage.set(1));
    }, { allowSignalWrites: true });

    // Carga reactiva mi-sucursal cuando auth listo
    effect(() => {
      const sucursalId = this.authFacade.sucursalId();
      if (sucursalId != null) {
        this.inventoryByBranchFacade.loadMyBranchInventory();
      }
    }, { allowSignalWrites: true });

    // Si cambia sucursal y estaba en filtro búsqueda, refresca
    effect(() => {
      // touch selectedCategory para recomputar si vuelve a entrar
      this.selectedCategoryId();
    });
  }

  ngOnInit(): void {
    this.productTypesFacade.loadProductTypes();
    const sucursalId = this.authFacade.sucursalId();
    if (sucursalId != null) {
      this.inventoryByBranchFacade.loadMyBranchInventory();
    }
  }

  reloadProducts(): void {
    this.currentPage.set(1);
    this.inventoryByBranchFacade.loadMyBranchInventory();
  }

  onSelectCategory(category: ProductType): void {
    this.selectedCategoryId.set(category.id);
    this.currentPage.set(1);
    // Filtrado local; mi-sucursal no tiene id_tipo, solo reset paginación
  }

  onLoadMore(): void {
    if (this.hasMore()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  onAddProduct(): void {
    const dialogRef = this.dialog.open(ProductFormDialogComponent, { data: {} });
    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.inventoryFacade.createProduct(result as any).subscribe({
          next: () => {
            this.toastService.success('Producto creado correctamente');
            this.inventoryByBranchFacade.loadMyBranchInventory();
          },
          error: () => {},
        });
      }
    });
  }

  onModifyProduct(product: Product | InventoryItem): void {
    // Producto proveniente de mi-sucursal (InventoryItem) -> mapear a Product para diálogo
    const asProduct: Product = this.toProduct(product);
    const dialogRef = this.dialog.open(ProductFormDialogComponent, { data: { product: asProduct } });
    dialogRef.closed.subscribe((result) => {
      if (result) {
        const id = (product as any).id ?? (product as InventoryItem).idProducto;
        this.inventoryFacade.updateProduct(id, result as any).subscribe({
          next: () => {
            this.toastService.success('Producto actualizado correctamente');
            this.inventoryByBranchFacade.loadMyBranchInventory();
          },
          error: () => {},
        });
      }
    });
  }

  onChangePrice(product: Product | InventoryItem): void {
    const sucursalId = this.authFacade.sucursalId();
    if (sucursalId == null) {
      this.toastService.error('No hay sucursal asignada para cambiar precio');
      return;
    }
    const idProducto = (product as any).id ?? (product as InventoryItem).idProducto;
    const dialogRef = this.dialog.open(SetPriceDialogComponent, {
      data: { idProducto, idSucursal: sucursalId },
    });
    dialogRef.closed.subscribe((result) => {
      if (result) {
        // POST /precios-sucursal  (antes /precio-sucursal/{{id}})
        this.branchPricingFacade.setBranchPrice(result as any).subscribe({
          next: () => {
            this.toastService.success('Precio de sucursal actualizado correctamente');
            this.inventoryByBranchFacade.loadMyBranchInventory();
          },
          error: () => {},
        });
      }
    });
  }

  onDeleteProduct(product: Product | InventoryItem): void {
    const nombre = (product as any).nombre;
    const id = (product as any).id ?? (product as InventoryItem).idProducto;
    const dialogRef = this.dialog.open<boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar Producto',
        message: `¿Estás seguro de que deseas eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        variant: 'danger',
      },
    });
    dialogRef.closed.subscribe((result) => {
      if (result) {
        this.inventoryFacade.deleteProduct(id).subscribe({
          next: () => {
            this.toastService.success('Producto eliminado correctamente');
            this.inventoryByBranchFacade.loadMyBranchInventory();
          },
          error: () => {},
        });
      }
    });
  }

  private toProduct(p: Product | InventoryItem): Product {
    if ('cantidad' in p) {
      // InventoryItem -> Product (para reutilizar ProductFormDialog)
      const it = p as InventoryItem;
      return {
        id: it.idProducto,
        idTipo: null,
        idProveedor: null,
        clave: it.clave,
        nombre: it.nombre,
        descripcion: null,
        codigoBarras: it.codigoBarras,
        precioVenta: it.precioBase,
        marca: it.marca,
        costo: it.costo,
        codigoSat: null,
      };
    }
    return p as Product;
  }
}
