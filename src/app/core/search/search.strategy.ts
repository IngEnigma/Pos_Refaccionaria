import { InjectionToken } from '@angular/core';
import { DefaultSearchStrategy } from './default-search.strategy';

export interface SearchStrategy<T> {
  search(items: T[], query: string): T[];
}

// Default para que cualquier página (y sus specs) pueda inyectar GlobalSearchService sin configurar nada.
export const SEARCH_STRATEGY = new InjectionToken<SearchStrategy<any>>('SEARCH_STRATEGY', {
  providedIn: 'root',
  factory: () => new DefaultSearchStrategy(),
});
