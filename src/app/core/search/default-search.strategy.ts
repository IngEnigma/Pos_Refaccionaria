import { Injectable } from '@angular/core';
import { SearchStrategy } from './search.strategy';

@Injectable({ providedIn: 'root' })
export class DefaultSearchStrategy<T> implements SearchStrategy<T> {
  search(items: T[], query: string): T[] {
    if (!query.trim()) {
      return items;
    }

    const lowerQuery = query.toLowerCase();

    return items.filter((item) => {
      return Object.values(item as any).some((value) => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerQuery);
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowerQuery);
        }
        return false;
      });
    });
  }
}
