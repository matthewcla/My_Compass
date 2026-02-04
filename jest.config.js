module.exports = {
    preset: 'react-native',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testEnvironment: 'node',
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|expo|@expo|expo-.*|@react-navigation|zustand)/)',
    ],
    setupFilesAfterEnv: [],
    testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
