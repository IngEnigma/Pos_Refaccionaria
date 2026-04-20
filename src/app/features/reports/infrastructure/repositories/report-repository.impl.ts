import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, switchMap, throwError, from } from 'rxjs';

import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { ReportParams } from '@features/reports/domain/entities/report-params.model';
import { ReportRepository } from '@features/reports/domain/repository/report-repository';

@Injectable({ providedIn: 'root' })
export class ReportRepositoryImpl implements ReportRepository {
  private readonly http = inject(HttpClient);
  private readonly env = inject<Environment>(APP_ENV);
  private readonly endpoint = `${this.env.apiUrl}/reporte/`;

  getReport(params: ReportParams): Observable<Blob> {
    let httpParams = new HttpParams().set('tipo', params.tipo);

    if (params.tipo === 'month') {
      if (params.year) httpParams = httpParams.set('year', params.year.toString());
      if (params.month) httpParams = httpParams.set('month', params.month.toString());
    }

    return this.http.get(this.endpoint, {
      params: httpParams,
      responseType: 'blob',
    }).pipe(
      catchError((error) => {
        if (error.error instanceof Blob && error.error.type === 'text/plain') {
          return from((error.error as Blob).text()).pipe(
            switchMap((text: string) => throwError(() => new Error(text || 'Error al generar el reporte')))
          );
        }
        
        // Si no es un Blob detectable o es de otro tipo, lanzamos error genérico o el objeto de error
        return throwError(() => new Error('Ocurrió un error al generar el reporte. Por favor, intente de nuevo.'));
      })
    );
  }
}
