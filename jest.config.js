/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['**/tests/*.test.ts'],
    setupFiles: ['./setup-jest.ts'],
};
