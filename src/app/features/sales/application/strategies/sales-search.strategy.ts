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

    // 1. Coincidencia exacta por ID (asumiendo que funge como código de barras en este modelo)
    const exactMatch = items.find(
      (item) => item.id.toString() === trimmedQuery
    );

    if (exactMatch) {
      return [exactMatch];
    }

    // 2. Búsqueda difusa (fuzzy search) con Fuse.js
    const fuse = new Fuse(items, {
      keys: [
        { name: 'nombre', weight: 0.7 },
        { name: 'descripcion', weight: 0.3 }
      ],
      threshold: 0.4, // Qué tan estricta es la similitud (0.0 exacto, 1.0 muy flexible)
      includeScore: true,
      shouldSort: true
    });

    const results = fuse.search(trimmedQuery);
    return results.map(result => result.item);
  }
}
