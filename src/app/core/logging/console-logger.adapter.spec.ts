import { TestBed } from '@angular/core/testing';
import { ConsoleLoggerAdapter } from './console-logger.adapter';
import { LogEntry } from './log.model';
import { LogLevel } from './log-level.enum';

describe('ConsoleLoggerAdapter', () => {
  let adapter: ConsoleLoggerAdapter;
  let consoleDebugSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConsoleLoggerAdapter],
    });
    adapter = TestBed.inject(ConsoleLoggerAdapter);

    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createEntry = (level: LogLevel, message: string, data?: unknown): LogEntry => ({
    level,
    message,
    timestamp: '2026-03-20T12:00:00Z',
    context: 'TestContext',
    data,
  });

  it('should call console.info for INFO level with styles', () => {
    const entry = createEntry(LogLevel.INFO, 'Info message');
    adapter.log(entry);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\].*\(TestContext\): Info message/),
        expect.stringContaining('color: #2ecc71'),
        ''
    );
  });

  it('should call console.debug for DEBUG level', () => {
    const entry = createEntry(LogLevel.DEBUG, 'Debug message');
    adapter.log(entry);

    expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\].*Debug message/),
        expect.any(String),
        ''
    );
  });

  it('should call console.warn for WARN level', () => {
    const entry = createEntry(LogLevel.WARN, 'Warn message');
    adapter.log(entry);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Warn message/),
        expect.any(String),
        ''
    );
  });

  it('should call console.error for ERROR level', () => {
    const entry = createEntry(LogLevel.ERROR, 'Error message');
    adapter.log(entry);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\].*Error message/),
        expect.any(String),
        ''
    );
  });

  it('should pass data as a separate argument for structured logging', () => {
    const data = { id: 1, foo: 'bar' };
    const entry = createEntry(LogLevel.INFO, 'Message', data);
    adapter.log(entry);

    expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        '',
        data
    );
  });
});
