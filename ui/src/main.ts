import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { defaultOptions } from '@data-fair/lib-vuetify'
import '@data-fair/lib-vuetify/style/global.scss'
import { createReactiveSearchParams } from '@data-fair/lib-vue/reactive-search-params.js'
import { createUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const reactiveSearchParams = createReactiveSearchParams()
const uiNotif = createUiNotif()
const vuetify = createVuetify({
  ...defaultOptions({}),
  icons: { defaultSet: 'mdi', aliases, sets: { mdi, } }
})
const i18n = createI18n({ locale: 'en' })

const app = createApp(App)
  .use(reactiveSearchParams)
  .use(uiNotif)
  .use(vuetify)
  .use(i18n)

app.mount('#app')
