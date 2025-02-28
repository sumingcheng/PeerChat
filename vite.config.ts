import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    },
    copyPublicDir: true
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        'react',
        'react-router-dom',
      ],
      dts: 'src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json']
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        charset: false,
      },
    },
  },
}) 