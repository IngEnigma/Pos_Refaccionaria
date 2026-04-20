import { ContextualLogger } from './contextual-logger';
import { LoggerPort } from './log.model';

describe('ContextualLogger', () => {
  let mockBaseLogger: jest.Mocked<Partial<LoggerPort>>;

  beforeEach(() => {
    mockBaseLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      withContext: jest.fn(),
    };
  });

  it('should delegate to base logger with context', () => {
    const logger = new ContextualLogger(mockBaseLogger as LoggerPort, 'CtxA');
    logger.info('Message', { data: 1 });

    expect(mockBaseLogger.info).toHaveBeenCalledWith('Message', { data: 1 }, 'CtxA');
  });

  it('should support nesting contexts via withContext', () => {
    const loggerA = new ContextualLogger(mockBaseLogger as LoggerPort, 'CtxA');
    const loggerB = loggerA.withContext('CtxB');

    expect(loggerB).toBeInstanceOf(ContextualLogger);
    
    loggerB.warn('Warning');
    expect(mockBaseLogger.warn).toHaveBeenCalledWith('Warning', undefined, 'CtxA:CtxB');
  });

  it('should support multiple levels of nesting', () => {
    const logger = new ContextualLogger(mockBaseLogger as LoggerPort, 'A')
      .withContext('B')
      .withContext('C');

    logger.debug('Deep');
    expect(mockBaseLogger.debug).toHaveBeenCalledWith('Deep', undefined, 'A:B:C');
  });
});
