import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { defaultOptions } from '@data-fair/lib-vuetify'
import '@data-fair/lib-vuetify/style/global.scss'
import { createReactiveSearchParams } from '@data-fair/lib-vue/reactive-search-params.js'
import { createUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { createI18n } from 'vue-i18n'
import { $uiConfig } from './context'
import App from './App.vue'

const reactiveSearchParams = createReactiveSearchParams()
const uiNotif = createUiNotif()
const vuetify = createVuetify({
  ...defaultOptions({}),
  icons: { defaultSet: 'mdi', aliases, sets: { mdi, } }
})
const initialLocale = document.cookie.match(/(?:^|;\s*)i18n_lang=([^;]+)/)?.[1] ?? $uiConfig.lang?.default ?? 'fr'
const i18n = createI18n({ locale: initialLocale })

const app = createApp(App)
  .use(reactiveSearchParams)
  .use(uiNotif)
  .use(vuetify)
  .use(i18n)

app.mount('#app')
