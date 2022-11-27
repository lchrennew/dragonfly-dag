import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [ vue() ],
    server: { port: 3003, host: '0.0.0.0' },
    build: {
        rollupOptions: {
            external: [ 'vue' ],
            output: {
                globals: {
                    vue: 'Vue'
                }
            }
        }
    }
})
