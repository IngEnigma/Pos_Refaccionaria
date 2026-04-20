import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { sanitizeUrlParams } from './url-sanitizer.utils';

@Injectable({ providedIn: 'root' })
export class UrlSanitizerService {
  private readonly document = inject(DOCUMENT);

  sanitizeUrlParams(urlWithParams: string): string {
    return sanitizeUrlParams(urlWithParams, this.document.location.origin);
  }
}
