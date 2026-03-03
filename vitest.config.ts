import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['services/**/*.ts', 'utils/**/*.ts', 'constants/**/*.ts', 'stores/**/*.ts'],
        },
    },
    resolve: {
        alias: {
            // Mock expo and react-native modules for tests
            'expo-secure-store': path.resolve(__dirname, '__tests__/__mocks__/expo-secure-store.ts'),
            'react-native': path.resolve(__dirname, '__tests__/__mocks__/react-native.ts'),
        },
    },
});
