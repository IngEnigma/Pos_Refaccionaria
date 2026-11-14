import { Observable } from 'rxjs';

import { SaleDetail } from '@features/sales/domain/entities/sale-detail.entity';

/**
 * POST /api/detalleventa/ deprecado para escritura.
 * La venta se crea de forma atómica vía POST /api/ventas/
 * { id_metodoPago, detalles: [{ producto, cantidad }] }.
 * Este repositorio queda solo para lectura (historial / ticket).
 */
export abstract class SaleDetailRepository {
  abstract getSaleDetails(): Observable<SaleDetail[]>;
}
