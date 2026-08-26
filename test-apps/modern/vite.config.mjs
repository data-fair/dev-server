import { defineConfig, loadEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  // This test app is a sub-package of the dev-server repo and shares its .env, so that the
  // dev-server and the app it proxies always agree on APP_PORT. A regular application reads
  // its own directory instead: loadEnv(mode, process.cwd(), '').
  const env = loadEnv(mode, fileURLToPath(new URL('../..', import.meta.url)), '')
  const port = Number(env.APP_PORT ?? 3000)
  return {
    base: env.PUBLIC_URL ?? '/app/',
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
      port,
      strictPort: !!env.APP_PORT,
      hmr: { port, protocol: 'ws' }
    }
  }
})
