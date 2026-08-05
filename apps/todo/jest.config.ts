/* eslint-disable */
export default {
  displayName: 'todo',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
    setupFilesAfterEnv: ['<rootDir>/src/test-setup.js'],
    collectCoverageFrom: [
      'src/app/component/todo/TodoForm.tsx',
      'src/app/component/todo/TodoList.tsx',
      'src/app/component/todo/TodoItem.tsx',
      'src/app/component/statistics/statsUtils.ts',
      'src/app/component/elements/ErrorFallback.tsx',
      'src/app/store/authStore.ts',
    ],
    coverageThreshold: {
      global: { statements: 70, branches: 50, functions: 70, lines: 70 },
    },
};
