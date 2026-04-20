import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';
import { LOGGER_PORT, LoggerPort } from '../logging/logger.port'; 
import { LOCAL_STORAGE } from '@core/tokens/storage.token';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let loggerMock: jest.Mocked<LoggerPort>;
  let storageMock: jest.Mocked<Storage>;

  beforeEach(() => {
    loggerMock = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    storageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    };

    TestBed.configureTestingModule({
      providers: [
        LocalStorageService,
        { provide: LOGGER_PORT, useValue: loggerMock },
        { provide: LOCAL_STORAGE, useValue: storageMock },
      ],
    });

    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getItem', () => {
    it('should retrieve a stored string from storage provider', () => {
      storageMock.getItem.mockReturnValue('myValue');
      expect(service.getItem('myKey')).toBe('myValue');
      expect(storageMock.getItem).toHaveBeenCalledWith('myKey');
      // Success log for GET was removed to reduce noise
      expect(loggerMock.debug).not.toHaveBeenCalled();
    });

    it('should return null if key does not exist', () => {
      storageMock.getItem.mockReturnValue(null);
      expect(service.getItem('nonExistent')).toBeNull();
    });

    it('should handle storage provider throws (e.g. security constraints)', () => {
      storageMock.getItem.mockImplementation(() => {
        throw new Error('Access Denied');
      });

      expect(service.getItem('myKey')).toBeNull();
      expect(loggerMock.error).toHaveBeenCalledWith('Error retrieving key', expect.any(Object));
    });
  });

  describe('getJSON', () => {
    it('should retrieve and parse a valid JSON', () => {
      storageMock.getItem.mockReturnValue(JSON.stringify({ name: 'Admin' }));
      const result = service.getJSON<{ name: string }>('user');
      expect(result).toEqual({ name: 'Admin' });
    });

    it('should return null if data is invalid JSON', () => {
      storageMock.getItem.mockReturnValue('{ bad format }');
      expect(service.getJSON('badJSON')).toBeNull();
      expect(loggerMock.error).toHaveBeenCalledWith('Error parsing key', expect.any(Object));
    });
  });

  describe('setItem', () => {
    it('should store a string value in storage provider', () => {
      service.setItem('myKey', 'myValue');
      expect(storageMock.setItem).toHaveBeenCalledWith('myKey', 'myValue');
      // Info was downgraded to Debug to reduce noise
      expect(loggerMock.debug).toHaveBeenCalledWith('Key stored successfully', { key: 'myKey' });
    });

    it('should handle quota exceeded errors', () => {
      storageMock.setItem.mockImplementation(() => {
        throw new Error('Quota Exceeded');
      });

      service.setItem('myKey', 'myValue');
      expect(loggerMock.error).toHaveBeenCalledWith('Error storing key', expect.any(Object));
    });
  });

  describe('setJSON', () => {
    it('should stringify and store a JSON value', () => {
      service.setJSON('user', { role: 'admin' });
      expect(storageMock.setItem).toHaveBeenCalledWith('user', '{"role":"admin"}');
    });

    it('should handle circular references or storage errors gracefully', () => {
      const circular: any = {};
      circular.self = circular; 

      service.setJSON('circular', circular);
      expect(loggerMock.error).toHaveBeenCalledWith('Error setting key', expect.any(Object));
    });
  });

  describe('removeItem', () => {
    it('should remove a key from storage provider', () => {
      service.removeItem('myKey');
      expect(storageMock.removeItem).toHaveBeenCalledWith('myKey');
      // Info was downgraded to Debug to reduce noise
      expect(loggerMock.debug).toHaveBeenCalledWith('Key removed successfully', { key: 'myKey' });
    });
    
    it('should handle errors during removal', () => {
        storageMock.removeItem.mockImplementation(() => {
            throw new Error('Error');
        });
        service.removeItem('myKey');
        expect(loggerMock.error).toHaveBeenCalledWith('Error removing key', expect.any(Object));
    });
  });
});
