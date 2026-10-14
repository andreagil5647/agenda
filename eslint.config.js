import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'storybook-static',
      'coverage',
      'playwright-report',
      // Generated from the API contract by `pnpm run api:generate`.
      'src/lib/api/schema.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  reactHooks.configs.flat['recommended-latest'],
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.js', 'test/setup/*.cjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.{js,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['**/*.cjs'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // Text a person reads or hears lives in the message catalogue, in every language, so a
    // screen cannot end up half translated. Words in markup are the usual way that happens.
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXText[value=/[A-Za-z]{2,}/]',
          message: 'Text in markup is not translated. Add it to the catalogue and use t().',
        },
        {
          selector: 'JSXElement > JSXExpressionContainer > Literal[value=/[A-Za-z]{2,}/]',
          message: 'Text in markup is not translated. Add it to the catalogue and use t().',
        },
        {
          selector: `JSXAttribute[name.name=/^(aria-label|aria-description|placeholder|title|alt|loadingLabel)$/] > Literal`,
          message:
            'This text is read by people or by screen readers, so it is not translated. Use t().',
        },
        {
          selector: `JSXAttribute[name.name=/^(aria-label|aria-description|placeholder|title|alt|loadingLabel)$/] > JSXExpressionContainer > :matches(Literal, TemplateLiteral)`,
          message:
            'This text is read by people or by screen readers, so it is not translated. Use t().',
        },
      ],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
  prettier,
);
