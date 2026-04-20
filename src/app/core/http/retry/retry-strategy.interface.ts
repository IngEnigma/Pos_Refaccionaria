import { HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RetryStrategy {
  canRetry(req: HttpRequest<unknown>, error: unknown, retryCount: number): boolean;
  getDelay(error: unknown, retryCount: number): Observable<number>;
}
