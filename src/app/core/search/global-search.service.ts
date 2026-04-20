import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SEARCH_STRATEGY } from './search.strategy';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly strategy = inject(SEARCH_STRATEGY);
  
  private readonly _searchQuery = new BehaviorSubject<string>('');
  
  readonly searchQuery = toSignal(
    this._searchQuery.asObservable(),
    { initialValue: '' }
  );

  setSearchQuery(query: string): void {
    this._searchQuery.next(query);
  }

  search<T>(items: T[]): T[] {
    return this.strategy.search(items, this.searchQuery());
  }
}
