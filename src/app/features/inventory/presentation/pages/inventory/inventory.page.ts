import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
      window.alert('El nombre del producto es obligatorio.');
      return;
    }

    if (this.tipoModal === 'add') {
      if (Number.isNaN(precio) || precio < 0) {
        window.alert('Ingresa un precio válido.');
        return;
      }
      if (Number.isNaN(stock) || stock < 0) {
        window.alert('Ingresa una cantidad en stock válida.');
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
      return;
    }

    if (this.tipoModal === 'edit') {
      if (typeof this.form.id === 'undefined') {
        window.alert('Producto no identificado para edición.');
        return;
      }
      if (Number.isNaN(precio) || precio < 0) {
        window.alert('Ingresa un precio válido.');
        return;
      }
      if (Number.isNaN(stock) || stock < 0) {
        window.alert('Ingresa una cantidad en stock válida.');
        return;
      }

      const idx = this.productos.findIndex((product) => product.id === this.form.id);
      if (idx === -1) {
        window.alert('No se encontró el producto a editar.');
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
    }
  }

  eliminarProducto(): void {
    if (this.tipoModal !== 'delete') {
      return;
    }

    const nombreAEliminar = (this.form.nombre ?? '').toString().trim();
    if (!nombreAEliminar) {
      window.alert('Escribe el nombre del producto a eliminar.');
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
        window.alert(`No se encontró ningún producto con el nombre "${nombreAEliminar}".`);
        return;
      }

      const matched = this.productos[partialIndex];
      const confirmPartial = window.confirm(`Se encontró "${matched.nombre}". ¿Eliminarlo?`);
      if (!confirmPartial) {
        return;
      }

      this.productos = this.productos.filter((_, index) => index !== partialIndex);
      this.cerrarModal();
      return;
    }

    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar "${this.productos[exactIndex].nombre}"?`,
    );
    if (!confirmDelete) {
      return;
    }

    this.productos = this.productos.filter((_, index) => index !== exactIndex);
    this.cerrarModal();
  }
}
