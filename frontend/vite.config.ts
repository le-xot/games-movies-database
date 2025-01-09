import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import { generateApi } from 'swagger-typescript-api'
import tailwind from 'tailwindcss'
import { defineConfig } from 'vite'
import svgLoader from 'vite-svg-loader'

export default defineConfig(({ isPreview, mode }) => {
  if (mode !== 'production' && !isPreview) {
    generateSwagger()
  }

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
      postcss: {
        plugins: [tailwind(), autoprefixer()],
      },
    },
    plugins: [vue(), svgLoader()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})

async function generateSwagger() {
  let tryCount = 0
  while (tryCount < 10) {
    try {
      await generateApi({
        name: 'api.ts',
        url: 'http://localhost:3000/docs-json',
        output: fileURLToPath(new URL(`./src/lib`, import.meta.url)),
        generateClient: true,
        httpClientType: 'fetch',
        singleHttpClient: true,
        extractEnums: true,
      })
      break
    } catch {
      tryCount++
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
}
