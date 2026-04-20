import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportParams } from '@features/reports/domain/entities/report-params.model';
import { ReportRepository } from '@features/reports/domain/repository/report-repository';

@Injectable({ providedIn: 'root' })
export class GetReportUseCase {
  private readonly reportRepository = inject(ReportRepository);

  execute(params: ReportParams): Observable<Blob> {
    return this.reportRepository.getReport(params);
  }
}
