import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import type {} from 'vite-ssg'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  ssr: {
    noExternal: ['oh-vue-icons'],
  },
  ssgOptions: {
    script: 'async',
    //formatting: 'minify', // this makes the html minified
    dirStyle: 'nested',
    includedRoutes: () => ['/', '/es'],
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
