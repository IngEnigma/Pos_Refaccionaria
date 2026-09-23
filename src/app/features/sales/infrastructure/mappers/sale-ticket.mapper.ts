import { SaleTicket } from '@features/sales/domain/entities/sale-ticket.entity';
import { SaleTicketDto } from '@features/sales/infrastructure/dtos/sale-ticket.dto';

export class SaleTicketMapper {
    static fromResponseDto(dto: SaleTicketDto): SaleTicket {
        return new SaleTicket({
            folio: dto.folio,
            fecha: dto.fecha,
            vendedor: dto.vendedor,
            metodoPago: dto.metodo_pago,
            sucursal: dto.sucursal,
            productos: dto.productos.map((producto) => ({
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                precioUnitario: producto.precio_unitario,
                subtotal: producto.subtotal,
            })),
            total: dto.total,
        });
    }
}