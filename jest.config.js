module.exports = {
  preset: 'jest-preset-angular',
  moduleNameMapper: {
    '^@env/(.*)$': '<rootDir>/src/env/$1',
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@core/(.*)$': '<rootDir>/src/app/core/$1',
    '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
    '^@features/(.*)$': '<rootDir>/src/app/features/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
};
