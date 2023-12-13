import { defineConfig } from "vite"

export default defineConfig({
    root: '.',
    build: {
        rollupOptions: {
            input: {
                main: 'src/index.ts'
            },
            output: {
                entryFileNames: 'bundle.js',
            },
        },
    },
    resolve: {
        alias: [
            { find: /^@\/(.*)$/, replacement: 'src/$1.ts' }
        ]
    },
    server: {
        port: 42069
    }
});
