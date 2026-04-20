import { TestBed, fakeAsync, tick, discardPeriodicTasks, flush } from '@angular/core/testing';
import { GlobalSearchService } from './global-search.service';
import { SEARCH_STRATEGY } from './search.strategy';
import { DefaultSearchStrategy } from './default-search.strategy';

describe('GlobalSearchService with DefaultSearchStrategy', () => {
  let service: GlobalSearchService;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        GlobalSearchService,
        { provide: SEARCH_STRATEGY, useClass: DefaultSearchStrategy },
      ],
    });
    service = TestBed.inject(GlobalSearchService);
    tick(300);
  }));

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', fakeAsync(() => {
    expect(service).toBeTruthy();
    flush();
  }));

  it('should filter items based on search query', fakeAsync(() => {
    const items = [
      { id: 1, name: 'Apple', category: 'Fruit' },
      { id: 2, name: 'Banana', category: 'Fruit' },
      { id: 3, name: 'Carrot', category: 'Vegetable' },
    ];

    service.setSearchQuery('apple');
    tick(300);
    const results = service.search(items);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Apple');
    flush();
  }));

  it('should filter across multiple properties', fakeAsync(() => {
    const items = [
      { name: 'Red Apple', color: 'Red' },
      { name: 'Green Apple', color: 'Green' },
      { name: 'Cherry', color: 'Red' },
    ];

    service.setSearchQuery('red');
    tick(300);
    const results = service.search(items);

    expect(results).toHaveLength(2);
    expect(results).toContainEqual(items[0]);
    expect(results).toContainEqual(items[2]);
    flush();
  }));

  it('should return all items if query is empty', fakeAsync(() => {
    const items = [{ name: 'A' }, { name: 'B' }];
    service.setSearchQuery('');
    tick(300);
    expect(service.search(items)).toHaveLength(2);
    flush();
  }));
});
