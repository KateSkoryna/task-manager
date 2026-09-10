/* eslint-disable */
export default {
  displayName: 'todo-be',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  setupFiles: ['<rootDir>/src/app/test-env-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/app/test-setup.ts'],
};
