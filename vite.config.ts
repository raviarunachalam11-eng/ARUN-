import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: './index.html',
        register: './register.html',
        dashboard: './dashboard.html',
        study: './study.html',
        test: './test.html',
        reports: './reports.html'
      }
    },
    copyPublicDir: true
  },
  publicDir: 'public'
})
