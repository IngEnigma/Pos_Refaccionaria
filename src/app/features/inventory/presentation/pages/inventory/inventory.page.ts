import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../../shared/ui/components/toast/toast.service';

type InventoryModalType = 'add' | 'edit' | 'delete';

interface InventoryProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen: string;
}

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.layout.css', './inventory.page.modal.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryPageComponent {
  private readonly toast = inject(ToastService);

  mostrarModal = false;
  tipoModal: InventoryModalType | null = null;
  form: Partial<InventoryProduct> = {};

  productos: InventoryProduct[] = [
    {
      id: 1,
      nombre: 'Aceite Castrol',
      descripcion: 'Aceite 10W-40 1L',
      precio: 180,
      stock: 25,
      imagen: 'assets/images/Refaccionaria.webp',
    },
    {
      id: 2,
      nombre: 'Filtro Bosch',
      descripcion: 'Filtro de aceite universal',
      precio: 90,
      stock: 40,
      imagen: 'assets/images/Refaccionaria.webp',
    },
    {
      id: 3,
      nombre: 'Bujía NGK',
      descripcion: 'Bujía iridium',
      precio: 120,
      stock: 12,
      imagen: 'assets/images/Refaccionaria.webp',
    },
  ];

  abrirModal(tipo: InventoryModalType, producto?: InventoryProduct): void {
    this.tipoModal = tipo;
    this.mostrarModal = true;

    if (tipo === 'edit' && producto) {
      this.form = { ...producto };
      return;
    }

    this.form = {};
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.tipoModal = null;
    this.form = {};
  }

  guardarCambios(): void {
    if (!this.tipoModal) {
      return;
    }

    const nombre = (this.form.nombre ?? '').toString().trim();
    const descripcion = (this.form.descripcion ?? '').toString().trim();
    const precio = Number(this.form.precio);
    const stock = Number(this.form.stock);

    if (!nombre) {
      this.toast.warning('El nombre del producto es obligatorio.');
      return;
    }

    if (this.tipoModal === 'add') {
      if (Number.isNaN(precio) || precio < 0) {
        this.toast.warning('Ingresa un precio válido.');
        return;
      }
      if (Number.isNaN(stock) || stock < 0) {
        this.toast.warning('Ingresa una cantidad en stock válida.');
        return;
      }

      const maxId = this.productos.reduce((max, product) => Math.max(max, product.id), 0);
      const nuevo: InventoryProduct = {
        id: maxId + 1,
        nombre,
        descripcion,
        precio,
        stock,
        imagen: this.form.imagen?.trim() || 'assets/images/Refaccionaria.webp',
      };

      this.productos = [nuevo, ...this.productos];
      this.cerrarModal();
      this.toast.success('Producto agregado correctamente.');
      return;
    }

    if (this.tipoModal === 'edit') {
      if (typeof this.form.id === 'undefined') {
        this.toast.error('Producto no identificado para edición.');
        return;
      }
      if (Number.isNaN(precio) || precio < 0) {
        this.toast.warning('Ingresa un precio válido.');
        return;
      }
      if (Number.isNaN(stock) || stock < 0) {
        this.toast.warning('Ingresa una cantidad en stock válida.');
        return;
      }

      const idx = this.productos.findIndex((product) => product.id === this.form.id);
      if (idx === -1) {
        this.toast.error('No se encontró el producto a editar.');
        return;
      }

      const actualizado: InventoryProduct = {
        ...this.productos[idx],
        nombre,
        descripcion,
        precio,
        stock,
        imagen: this.form.imagen?.trim() || this.productos[idx].imagen,
      };

      this.productos = [
        ...this.productos.slice(0, idx),
        actualizado,
        ...this.productos.slice(idx + 1),
      ];

      this.cerrarModal();
      this.toast.success('Producto actualizado correctamente.');
    }
  }

  eliminarProducto(): void {
    if (this.tipoModal !== 'delete') {
      return;
    }

    const nombreAEliminar = (this.form.nombre ?? '').toString().trim();
    if (!nombreAEliminar) {
      this.toast.warning('Escribe el nombre del producto a eliminar.');
      return;
    }

    const exactIndex = this.productos.findIndex(
      (product) => product.nombre.toLowerCase() === nombreAEliminar.toLowerCase(),
    );

    if (exactIndex === -1) {
      const partialIndex = this.productos.findIndex((product) =>
        product.nombre.toLowerCase().includes(nombreAEliminar.toLowerCase()),
      );

      if (partialIndex === -1) {
        this.toast.error(`No se encontró ningún producto con el nombre "${nombreAEliminar}".`);
        return;
      }

      const matched = this.productos[partialIndex];

      this.productos = this.productos.filter((_, index) => index !== partialIndex);
      this.cerrarModal();
      this.toast.success(`Producto "${matched.nombre}" eliminado correctamente.`);
      return;
    }

    const nombreExacto = this.productos[exactIndex].nombre;
    this.productos = this.productos.filter((_, index) => index !== exactIndex);
    this.cerrarModal();
    this.toast.success(`Producto "${nombreExacto}" eliminado correctamente.`);
  }
}
