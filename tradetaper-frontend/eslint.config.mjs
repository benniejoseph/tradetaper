import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '.next/*',
      'out/**',
      'dist/**',
      'build/**',
      'node_modules/**',
      '**/*.config.js',
      '**/*.config.ts',
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', {
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_',
        'caughtErrorsIgnorePattern': '^_'
      }],
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',  // Keep this as error - it's critical
      'react/no-unescaped-entities': 'warn',
      '@next/next/no-img-element': 'warn',
      'import/no-anonymous-default-export': 'warn',
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn',
    },
  },
];

export default eslintConfig;
