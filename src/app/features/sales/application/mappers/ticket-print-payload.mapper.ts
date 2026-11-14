import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';

/** Payload snake_case que espera el proceso principal de Electron para imprimir. */
export function toTicketPrintPayload(ticket: SaleTicket) {
  return {
    folio: ticket.folio,
    fecha: ticket.fecha,
    vendedor: ticket.vendedor,
    metodo_pago: ticket.metodoPago,
    sucursal: ticket.sucursal,
    productos: ticket.productos.map((p) => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      subtotal: p.subtotal,
      precio_unitario: p.precioUnitario,
    })),
    total: ticket.total,
  };
}
