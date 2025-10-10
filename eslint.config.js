import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react/configs/recommended.js'
import pluginReactHooks from 'eslint-plugin-react-hooks'
import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // 1. Global ignores (menggantikan .eslintignore)
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'dist/',
      'lib/database.types.ts', //
    ],
  },

  // 2. Konfigurasi dasar yang berlaku untuk semua file
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...pluginReact,
    files: ['**/*.{ts,tsx}'], // Terapkan aturan React hanya pada file TS/TSX
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals'],

  // 3. Konfigurasi utama untuk file proyek
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Menambahkan aturan penting untuk React Hooks
      ...pluginReactHooks.configs.recommended.rules,

      // Aturan kustom Anda
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'react/react-in-jsx-scope': 'off', 
      'react/prop-types': 'off', 
    },
  },

  prettierConfig,
]J