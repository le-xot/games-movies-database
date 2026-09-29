import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'
import { generateSwagger } from './scripts/generate-swagger'

export default defineConfig(({ isPreview, mode }) => {
  if (mode !== 'production' && !isPreview) {
    void generateSwagger()
  }

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      postcss: {
        plugins: [autoprefixer()],
      },
    },
    plugins: [vue(), svgLoader(), tailwindcss()],
    build: {
      reportCompressedSize: false,
    },
    clearScreen: false,
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/socket.io': {
          ws: true,
          rewriteWsOrigin: true,
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
