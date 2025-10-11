const nextJest = require('next/jest')
 
const createJestConfig = nextJest({
  dir: './',
})
 
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/tests/e2e/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!node-fetch)/'],
}
 
module.exports = createJestConfig(customJestConfig) 