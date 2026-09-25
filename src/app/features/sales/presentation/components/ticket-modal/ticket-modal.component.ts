import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { ToastService } from '@app/shared/ui/components/toast/toast.service';

@Component({
  selector: 'app-ticket-modal',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="header-left">
            <span class="modal-badge">Venta exitosa</span>
            <h2 class="modal-title">Ticket #{{ ticket().folio }}</h2>
            <span class="modal-subtitle">Comprobante de venta</span>
          </div>
          <button class="btn-close" (click)="close.emit()" aria-label="Cerrar">
            ✕
          </button>
        </header>

        <section class="modal-body">
          <div class="ticket-paper" tabindex="0" aria-label="Vista previa del ticket">
            <!-- Encabezado estilo térmico -->
            <div class="ticket-header">
              <div class="ticket-store">REFACCIONARIA</div>
              @if (ticket().sucursal) {
                <div class="ticket-branch">{{ ticket().sucursal }}</div>
              }
              <div class="ticket-divider-dashed"></div>
            </div>

            <!-- Info venta -->
            <div class="ticket-meta">
              <div class="meta-row"><span>Folio:</span><strong>{{ ticket().folio }}</strong></div>
              @if (ticket().fecha) {
                <div class="meta-row"><span>Fecha:</span><span>{{ ticket().fecha | date: 'dd/MM/yyyy HH:mm' }}</span></div>
              }
              @if (ticket().vendedor) {
                <div class="meta-row"><span>Vendedor:</span><span>{{ ticket().vendedor }}</span></div>
              }
              @if (ticket().metodoPago) {
                <div class="meta-row"><span>Pago:</span><span>{{ ticket().metodoPago }}</span></div>
              }
            </div>

            <div class="ticket-divider-solid"></div>

            <!-- Productos -->
            <div class="ticket-products-header">
              <span>Cant.</span>
              <span>Producto</span>
              <span>Subtotal</span>
            </div>
            <div class="ticket-products">
              @for (prod of ticket().productos; track prod.nombre + $index) {
                <div class="product-row">
                  <span class="product-qty">{{ prod.cantidad }}x</span>
                  <span class="product-name">{{ prod.nombre }}</span>
                  <span class="product-subtotal">{{ prod.subtotal | currency:'MXN':'symbol':'1.2-2' }}</span>
                </div>
                <div class="product-unit">Unit: {{ prod.precioUnitario | currency:'MXN':'symbol':'1.2-2' }}</div>
              }
            </div>

            <div class="ticket-divider-solid"></div>

            <!-- Total -->
            <div class="ticket-total">
              <span>TOTAL</span>
              <span class="total-value">{{ ticket().total | currency:'MXN':'symbol':'1.2-2' }}</span>
            </div>

            <div class="ticket-footer">
              <p>¡Gracias por su compra!</p>
              <small>Conserve este ticket para cambios o aclaraciones</small>
            </div>
          </div>
          <p class="scroll-hint">Desliza para ver todo el ticket</p>
        </section>

        <footer class="modal-footer">
          <button class="btn-secondary" (click)="close.emit()">Cerrar</button>
          <button
            class="btn-primary"
            (click)="onReprint()"
            [disabled]="isReprinting()"
          >
            @if (isReprinting()) {
              Reimprimiendo...
            } @else {
              🖨 Reimprimir ticket
            }
          </button>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.7);backdrop-filter:blur(8px);display:flex;justify-content:center;align-items:center;z-index:3000;padding:16px}
    .modal-content{background:#fff;border-radius:16px;width:100%;max-width:440px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1px solid #e2e8f0;overflow:hidden}
    .modal-header{padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:flex-start;flex-shrink:0}
    .header-left{display:flex;flex-direction:column;gap:2px}
    .modal-badge{background:#dcfce7;color:#16a34a;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:2px 8px;border-radius:4px;width:fit-content}
    .modal-title{margin:4px 0 0;color:#0f172a;font-size:1.2rem;font-weight:800;line-height:1.1}
    .modal-subtitle{font-size:.78rem;color:#64748b}
    .btn-close{background:#f1f5f9;border:none;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;font-size:1rem;flex-shrink:0}
    .btn-close:hover{background:#fee2e2;color:#dc2626}
    .modal-body{padding:16px 20px;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;background:#f8fafc}
    .ticket-paper{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:18px;font-family:'Courier New',monospace;font-size:.84rem;line-height:1.45;color:#0f172a;max-height:52vh;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#cbd5e1 transparent}
    .ticket-paper::-webkit-scrollbar{width:6px}
    .ticket-paper::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:6px}
    .ticket-header{text-align:center}
    .ticket-store{font-weight:900;font-size:1.05rem;letter-spacing:.08em}
    .ticket-branch{font-size:.78rem;color:#334155;margin-top:2px;word-break:break-word}
    .ticket-divider-dashed{border-top:1px dashed #cbd5e1;margin:12px 0}
    .ticket-divider-solid{border-top:2px solid #0f172a;margin:12px 0}
    .ticket-meta{display:flex;flex-direction:column;gap:4px;font-size:.82rem}
    .meta-row{display:flex;justify-content:space-between;gap:12px}
    .meta-row span:first-child{color:#64748b}
    .meta-row strong,.meta-row span:last-child{font-weight:600;text-align:right;word-break:break-word}
    .ticket-products-header{display:grid;grid-template-columns:40px 1fr 90px;gap:8px;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#64748b;padding-bottom:6px;border-bottom:1px dashed #e2e8f0}
    .ticket-products{display:flex;flex-direction:column;gap:6px}
    .product-row{display:grid;grid-template-columns:40px 1fr 90px;gap:8px;align-items:start;font-size:.82rem}
    .product-qty{font-weight:700}
    .product-name{word-break:break-word;font-weight:600}
    .product-subtotal{text-align:right;font-weight:700}
    .product-unit{font-size:.72rem;color:#64748b;margin-left:48px;margin-top:-2px}
    .ticket-total{display:flex;justify-content:space-between;align-items:center;font-weight:900;font-size:1.05rem}
    .total-value{font-size:1.15rem}
    .ticket-footer{text-align:center;margin-top:14px}
    .ticket-footer p{margin:0;font-weight:700;font-size:.82rem}
    .ticket-footer small{color:#64748b;font-size:.7rem}
    .scroll-hint{text-align:center;font-size:.68rem;color:#94a3b8;margin:2px 0 0}
    .modal-footer{padding:14px 20px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;background:#fff}
    .btn-primary,.btn-secondary{padding:10px 18px;border-radius:10px;font-weight:700;font-size:.88rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid transparent;min-width:132px}
    .btn-primary{background:#2563eb;color:#fff;border-color:#2563eb}
    .btn-primary:hover:not(:disabled){background:#1d4ed8}
    .btn-primary:disabled{opacity:.6;cursor:not-allowed}
    .btn-secondary{background:#fff;color:#334155;border-color:#e2e8f0}
    .btn-secondary:hover{background:#f8fafc;border-color:#cbd5e1}
    @media(max-height:700px){.scroll-hint{display:block}}
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketModalComponent {
  ticket = input.required<SaleTicket>();
  close = output<void>();

  private readonly toast = inject(ToastService);
  readonly isReprinting = signal(false);

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  async onReprint(): Promise<void> {
    if (this.isReprinting()) return;
    this.isReprinting.set(true);

    const t = this.ticket();
    const payload = {
      folio: t.folio,
      fecha: t.fecha,
      vendedor: t.vendedor,
      metodo_pago: t.metodoPago,
      sucursal: t.sucursal,
      productos: t.productos.map((p) => ({
        nombre: p.nombre,
        cantidad: p.cantidad,
        subtotal: p.subtotal,
        precio_unitario: p.precioUnitario,
      })),
      total: t.total,
    };

    try {
      const w = window as unknown as { desktop?: { generateTicket: (d: unknown) => Promise<{ success: boolean; message?: string }> } };
      if (!w.desktop?.generateTicket) {
        // Fallback web: solo simula
        console.log('[TicketModal] Preview payload', payload);
        this.toast.success('Ticket listo para reimpresión (modo web)');
        return;
      }
      const response = await w.desktop.generateTicket(payload);
      if (!response.success) {
        this.toast.error(response.message ?? 'No fue posible reimprimir el ticket.');
      } else {
        this.toast.success('Ticket reimpreso correctamente.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al reimprimir ticket';
      this.toast.error(msg);
    } finally {
      this.isReprinting.set(false);
    }
  }
}
