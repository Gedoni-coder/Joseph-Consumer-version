import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        ignores: [
            'coverage/**',
            'dist/**',
            'node_modules/**',
            'core/*/dist/**',
            'prisma/migrations/**'
        ]
    },
    {
        files: ['**/*.ts', '**/*.mts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            '@typescript-eslint': tsPlugin
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    varsIgnorePattern: '^_'
                }
            ]
        }
    }
];
