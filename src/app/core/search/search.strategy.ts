import { InjectionToken } from '@angular/core';

export interface SearchStrategy<T> {
  search(items: T[], query: string): T[];
}

export const SEARCH_STRATEGY = new InjectionToken<SearchStrategy<any>>('SEARCH_STRATEGY');
