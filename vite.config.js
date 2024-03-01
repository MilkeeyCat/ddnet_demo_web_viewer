import { defineConfig } from "vite"
import { resolve } from "node:path";

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
            { find: "@", replacement: resolve(__dirname, "./src") }
        ]
    },
    server: {
        port: 42069
    }
});
