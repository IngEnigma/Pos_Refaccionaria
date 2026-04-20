import { TestBed } from '@angular/core/testing';
import { InMemoryStorageService } from './in-memory-storage.service';
import { LOGGER_PORT, LoggerPort } from '../logging/logger.port';

describe('InMemoryStorageService', () => {
  let service: InMemoryStorageService;
  let loggerMock: jest.Mocked<Partial<LoggerPort>>;

  beforeEach(() => {
    loggerMock = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    TestBed.configureTestingModule({
      providers: [
        InMemoryStorageService,
        { provide: LOGGER_PORT, useValue: loggerMock },
      ],
    });

    service = TestBed.inject(InMemoryStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve values', () => {
    service.setItem('key', 'value');
    expect(service.getItem('key')).toBe('value');
  });

  it('should return null for non-existent keys', () => {
    expect(service.getItem('none')).toBeNull();
  });

  it('should remove items', () => {
    service.setItem('key', 'value');
    service.removeItem('key');
    expect(service.getItem('key')).toBeNull();
  });

  it('should store and retrieve JSON', () => {
    const data = { id: 1, name: 'Test' };
    service.setJSON('data', data);
    expect(service.getJSON('data')).toEqual(data);
  });

  it('should return null for invalid JSON', () => {
    service.setItem('bad', '{');
    expect(service.getJSON('bad')).toBeNull();
    expect(loggerMock.error).toHaveBeenCalled();
  });
});
