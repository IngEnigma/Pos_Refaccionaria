import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { SEARCH_STRATEGY } from './search.strategy';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly strategy = inject(SEARCH_STRATEGY);
  
  private readonly _searchQuery = new BehaviorSubject<string>('');
  
  readonly searchQuery = toSignal(
    this._searchQuery.asObservable(),
    { initialValue: '' }
  );

  /** Qué hace Enter en el buscador global; la página activa lo registra (POS: escanear y agregar). */
  readonly submitHandler = signal<((query: string) => boolean) | null>(null);

  /** true = la página consumió el texto y el buscador debe limpiarse. */
  submit(query: string): boolean {
    return this.submitHandler()?.(query) ?? false;
  }

  setSearchQuery(query: string): void {
    this._searchQuery.next(query);
  }

  search<T>(items: T[]): T[] {
    return this.strategy.search(items, this.searchQuery());
  }
}
