import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server:{port: 3003},
    build: {
        lib: {
            entry: path.resolve(__dirname, 'build.js'),
            name: 'DragonflyDag',
        },
        sourcemap: true,
        cssCodeSplit: true,
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }
})
