import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

export default defineConfig({
  base: process.env.PUBLIC_URL ?? '/app/',
  plugins: [
    Vue({
      template: { transformAssetUrls, compilerOptions: { isCustomElement: tag => ['d-frame'].includes(tag) } }
    }),
    VueI18nPlugin(),
    Vuetify({ autoImport: true })
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    port: 3000,
    hmr: { port: 3000, protocol: 'ws' }
  }
})
