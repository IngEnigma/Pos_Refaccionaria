import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DetailedSale } from '../../../../sales/domain/entities/detailed-sale.entity';

@Component({
  selector: 'app-sale-detail-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-main">
            <span class="modal-badge">Venta</span>
            <h2>Folio #{{ sale().id }}</h2>
          </div>
          <button class="btn-close" (click)="close.emit()">
            <i class="lucide-x"></i>
          </button>
        </header>

        <section class="modal-body">
          <div class="sale-summary-grid">
            <div class="summary-item">
              <span class="label">Fecha y Hora</span>
              <span class="value">{{ sale().fecha.value | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Vendedor</span>
              <span class="value">{{ sellerName() }}</span>
            </div>
            <div class="summary-item primary">
              <span class="label">Total de Venta</span>
              <span class="value highlight">{{ sale().total.value | currency: 'MXN' }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3 class="section-title">Productos Vendidos</h3>
            <div class="table-wrapper">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th class="text-center">Cant.</th>
                    <th class="text-right">Unitario</th>
                    <th class="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of sale().detalles; track item.id) {
                    <tr>
                      <td>
                        <div class="product-name">{{ item.producto.nombre }}</div>
                      </td>
                      <td><span class="code-badge">{{ item.producto.codigoBarras }}</span></td>
                      <td class="text-center">
                        <span class="qty-badge">{{ item.cantidad.value }}</span>
                      </td>
                      <td class="text-right">{{ item.producto.precioVenta.value | currency: 'MXN' }}</td>
                      <td class="text-right font-bold">{{ item.subtotal.value | currency: 'MXN' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer class="modal-footer">
          <button class="btn-secondary" (click)="close.emit()">Cerrar</button>
          <button class="btn-primary" (click)="close.emit()">
            <i class="lucide-printer"></i>
            Imprimir Ticket
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      padding: var(--pr-space-4);
    }

    .modal-content {
      background: var(--ds-bg-surface);
      border-radius: var(--pr-radius-xl);
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: var(--pr-shadow-xl);
      border: 1px solid var(--ds-border-subtle);
      overflow: hidden;
    }

    .modal-header {
      padding: var(--pr-space-5) var(--pr-space-6);
      background: var(--ds-bg-surface);
      border-bottom: 1px solid var(--ds-border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .modal-badge {
      background: var(--ds-color-primary-ghost);
      color: var(--ds-color-primary);
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      width: fit-content;
    }

    .modal-header h2 { 
      margin: 0; 
      color: var(--ds-text-strong);
      font-family: var(--pr-font-title);
      font-size: 1.5rem;
    }

    .btn-close { 
      background: var(--ds-bg-muted);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: var(--pr-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--ds-text-muted);
      transition: var(--comp-transition);
    }

    .btn-close:hover {
      background: var(--pr-red-50);
      color: var(--ds-color-danger);
    }

    .modal-body { 
      padding: var(--pr-space-6); 
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--pr-space-6);
    }

    .sale-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: var(--pr-space-4);
      background: var(--ds-bg-muted);
      padding: var(--pr-space-5);
      border-radius: var(--pr-radius-lg);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-item .label {
      font-size: 0.75rem;
      color: var(--ds-text-muted);
      font-weight: var(--pr-weight-semibold);
      text-transform: uppercase;
    }

    .summary-item .value {
      font-size: 1rem;
      color: var(--ds-text-strong);
      font-weight: var(--pr-weight-semibold);
    }

    .summary-item.primary .highlight {
      color: var(--ds-color-primary);
      font-size: 1.5rem;
      font-weight: 800;
    }

    .section-title {
      margin: 0 0 var(--pr-space-4);
      font-size: 1.1rem;
      color: var(--ds-text-strong);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .table-wrapper {
      border: 1px solid var(--ds-border-subtle);
      border-radius: var(--pr-radius-lg);
      overflow: hidden;
    }

    .detail-table { width: 100%; border-collapse: collapse; }
    
    .detail-table th { 
      text-align: left; 
      padding: 12px 16px; 
      background: var(--ds-bg-muted);
      color: var(--ds-text-muted);
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
    }

    .detail-table td { 
      padding: 14px 16px; 
      border-bottom: 1px solid var(--ds-border-subtle);
      color: var(--ds-text-base);
      font-size: var(--pr-font-size-sm);
    }

    .detail-table tr:last-child td { border-bottom: none; }

    .product-name { font-weight: var(--pr-weight-semibold); color: var(--ds-text-strong); }
    .code-badge { font-family: monospace; color: var(--ds-text-muted); font-size: 0.8rem; }
    .qty-badge { 
      background: var(--ds-bg-muted);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
    }

    .font-bold { font-weight: 800; color: var(--ds-text-strong); }
    .text-center { text-align: center; }
    .text-right { text-align: right; }

    .modal-footer { 
      padding: var(--pr-space-5) var(--pr-space-6); 
      border-top: 1px solid var(--ds-border-subtle); 
      display: flex; 
      justify-content: flex-end; 
      gap: var(--pr-space-3);
      background: var(--ds-bg-surface);
    }

    .btn-primary, .btn-secondary {
      padding: 10px 24px;
      border-radius: var(--pr-radius-lg);
      font-weight: var(--pr-weight-semibold);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: var(--comp-transition);
    }

    .btn-primary {
      background: var(--ds-color-primary);
      color: white;
      border: none;
    }

    .btn-primary:hover {
      background: var(--ds-color-primary-strong);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--ds-bg-surface);
      color: var(--ds-text-base);
      border: 1px solid var(--ds-border-base);
    }

    .btn-secondary:hover {
      background: var(--ds-bg-muted);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleDetailModalComponent {
  sale = input.required<DetailedSale>();
  sellerName = input<string>('');
  close = output<void>();
}
