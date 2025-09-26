module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/setupTests.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
    '/src/setupTests.ts'
  ],
  verbose: true,
  testTimeout: 10000
};