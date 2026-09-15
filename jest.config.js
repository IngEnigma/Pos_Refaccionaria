module.exports = {
  preset: 'jest-preset-angular',
  moduleNameMapper: {
    '^@env/(.*)$': '<rootDir>/src/env/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1',
    '^@shell/(.*)$': '<rootDir>/src/app/shell/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/dist/', '/coverage/'],
  collectCoverage: false,
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.routes.ts',
    '!src/main.ts',
    '!src/env/environment*.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'lcov', 'text-summary', 'clover'],
  // Baseline real 2026-09-14: statements ~31%, branches ~25%, lines ~31%, functions ~24%
  // con 8 suites en rojo pre-existente (deriva de contrato tras sync backend).
  // Subir por fases según docs/plan-pruebas.md §4: Fase 2 → 50/40/50/40, Fase 3 → 70/60/70/65.
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 28,
      statements: 28
    }
  }
};
