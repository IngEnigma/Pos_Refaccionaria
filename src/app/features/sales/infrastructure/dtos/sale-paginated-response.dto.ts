import { SaleResponseDto } from './sale-response.dto';

/**
 * Respuesta paginada de GET /api/ventas/?page=&page_size=.
 * Sin ?page el backend devuelve lista plana SaleResponseDto[].
 */
export interface SalePaginatedResponseDto {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  sucursal_id: number | null;
  results: SaleResponseDto[];
}
