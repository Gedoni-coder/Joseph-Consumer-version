import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '@app-core/db': fromRoot('./core/db/src/index.ts'),
            '@app-core/errors': fromRoot('./core/errors/src/index.ts'),
            '@app-core/jwt': fromRoot('./core/jwt/src/index.ts'),
            '@app-core/logger': fromRoot('./core/logger/src/index.ts'),
            '@app-core/messages': fromRoot('./core/messages/src/index.ts'),
            '@app-core/repository': fromRoot('./core/repository/src/index.ts')
        }
    },
    test: {
        environment: 'node',
        globals: true,
        passWithNoTests: true,
        include: ['tests/**/*.test.ts', 'src/**/*.test.ts', 'core/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/prisma/**'],
        clearMocks: true,
        restoreMocks: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: [
                'dist/**',
                'prisma/**',
                'scripts/**',
                '**/*.config.ts',
                '**/index.ts'
            ]
        }
    }
});
