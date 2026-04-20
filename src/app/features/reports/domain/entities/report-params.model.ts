export type ReportType = 'day' | 'week' | 'biweek' | 'month';

export interface ReportParams {
  tipo: ReportType;
  year?: number;
  month?: number;
}
