import { Injectable } from '@angular/core';
import { SearchStrategy } from '@core/search/search.strategy';
import { SalesProduct } from '@features/sales/presentation/models/sales-ui.models';
import Fuse from 'fuse.js';

@Injectable({ providedIn: 'root' })
export class SalesSearchStrategy implements SearchStrategy<SalesProduct> {
  search(items: SalesProduct[], query: string): SalesProduct[] {
    if (!query || query.trim() === '') {
      return items;
    }

    const trimmedQuery = query.trim();

    const barcodeMatch = items.find(
      (item) => item.codigoBarras === trimmedQuery
    );

    if (barcodeMatch) {
      return [barcodeMatch];
    }

    const fuse = new Fuse(items, {
      keys: [
        { name: 'nombre', weight: 0.6 },
        { name: 'descripcion', weight: 0.2 },
        { name: 'codigoBarras', weight: 0.2 },
      ],
      threshold: 0.4,
      includeScore: true,
      shouldSort: true,
    });

    const results = fuse.search(trimmedQuery);
    return results.map(result => result.item);
  }
}
