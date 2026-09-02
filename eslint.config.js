import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist + course/** — исходники курсов (скелеты заданий со TODO, не код платформы);
  // src/lib/node-shims.js — замороженная строка sandbox-шимов (генерация из node-shims.js)
  globalIgnores(['dist', 'course/**', 'src/lib/node-shims.js']),
  {
    files: ['**/*.config.js', 'api/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
