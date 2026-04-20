import { Sale } from '@features/sales/domain/entities/sale.entity';

export interface SaleHistory extends Sale {
  usuarioNombre: string;
}
