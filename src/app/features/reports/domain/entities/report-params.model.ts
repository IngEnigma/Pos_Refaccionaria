export type ReportType = 'day' | 'week' | 'quincena' | 'month' | 'year';

export interface ReportParams {
  tipo: ReportType;
  year?: number;
  month?: number;
  quincena?: 1 | 2;
}
