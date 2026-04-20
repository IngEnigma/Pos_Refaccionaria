import { TestBed } from '@angular/core/testing';
import { LoggerService, LOGGER_ADAPTERS } from './logger.service';
import { LOGGING_LEVEL_TOKEN } from './logging-level.token';
import { LogLevel } from './log-level.enum';
import { LoggerAdapter } from './logger.adapter';

describe('LoggerService', () => {
  let service: LoggerService;
  let mockAdapter1: jest.Mocked<LoggerAdapter>;
  let mockAdapter2: jest.Mocked<LoggerAdapter>;

  beforeEach(() => {
    mockAdapter1 = { log: jest.fn() };
    mockAdapter2 = { log: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        LoggerService,
        { provide: LOGGING_LEVEL_TOKEN, useValue: LogLevel.INFO },
        { provide: LOGGER_ADAPTERS, useValue: [mockAdapter1, mockAdapter2] },
      ],
    });

    service = TestBed.inject(LoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not log debug messages when level is INFO', () => {
    service.debug('Debug message');
    expect(mockAdapter1.log).not.toHaveBeenCalled();
  });

  it('should log info messages when level is INFO', () => {
    service.info('Info message', { test: 1 });
    expect(mockAdapter1.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.INFO,
        message: 'Info message',
        data: { test: 1 },
      })
    );
    expect(mockAdapter2.log).toHaveBeenCalled();
  });

  it('should add context via withContext', () => {
    const contextLogger = service.withContext('TestContext');
    contextLogger.error('Error msg');

    expect(mockAdapter1.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.ERROR,
        message: 'Error msg',
        context: 'TestContext',
      })
    );
  });

  it('should append contexts when withContext is called multiple times', () => {
    const nestedLogger = service.withContext('Feature').withContext('Component');
    nestedLogger.warn('Warning');

    expect(mockAdapter1.log).toHaveBeenCalledWith(
      expect.objectContaining({
        level: LogLevel.WARN,
        message: 'Warning',
        context: 'Feature:Component',
      })
    );
  });
});
