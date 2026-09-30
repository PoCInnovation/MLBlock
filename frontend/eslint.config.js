// Configuration ESLint flat (v9) — presets recommandés SANS type-checking :
// le codebase n'a jamais été linté, les règles type-aware noieraient le signal.
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { plugin as shadcn } from '@shadcn/lint'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      shadcn,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'shadcn/no-restyle': 'off',
      'shadcn/no-raw-colors': 'error',
      'shadcn/no-arbitrary-values': 'off',
      'shadcn/no-inline-styles': ['error', { allow: ['transform', 'top', 'opacity', 'gridRow', 'zIndex', 'background', 'backgroundColor', 'color', 'fontSize', 'padding', 'borderRadius', 'border', 'maxWidth', 'minWidth', 'width', 'minHeight', 'height', 'maxHeight'] }],
      'shadcn/no-unknown-classes': 'error',
      'shadcn/require-static-classes': 'off',
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'shadcn/no-arbitrary-values': 'off',
      'shadcn/no-restyle': 'off',
      'shadcn/no-unknown-classes': 'off',
    },
  },
)
