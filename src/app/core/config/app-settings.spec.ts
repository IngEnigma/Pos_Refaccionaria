import { TestBed } from '@angular/core/testing';
import { AppSettingsService } from './app-settings';
import { APP_ENV } from '@core/tokens/app-env.token';
import { Environment } from '@env/environment.model';
import { LogLevel } from '@core/logging/log-level.enum';

describe('AppSettingsService', () => {
  let service: AppSettingsService;
  const mockEnv: Environment = {
    production: false,
    apiUrl: 'http://localhost:3000',
    loggingLevel: LogLevel.DEBUG,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppSettingsService,
        { provide: APP_ENV, useValue: mockEnv },
      ],
    });
    service = TestBed.inject(AppSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose apiUrl from env', () => {
    expect(service.apiUrl).toBe(mockEnv.apiUrl);
  });

  it('should expose production flag from env', () => {
    expect(service.production).toBe(mockEnv.production);
  });
});
