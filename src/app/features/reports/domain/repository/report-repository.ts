import { Observable } from 'rxjs';
import { ReportParams } from '../entities/report-params.model';

export abstract class ReportRepository {
  abstract getReport(params: ReportParams): Observable<Blob>;
}
