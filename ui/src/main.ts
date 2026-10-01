import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { defaultOptions, vuetifySessionOptions } from '@data-fair/lib-vuetify'
import { createSession } from '@data-fair/lib-vue/session.js'
import '@data-fair/lib-vuetify/style/global.scss'
import { createReactiveSearchParams } from '@data-fair/lib-vue/reactive-search-params.js'
import { createUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { createI18n } from 'vue-i18n'
import { $uiConfig } from './context'
import App from './App.vue'

// the site theme of the remote data-fair, as the previewed app gets it ; the lib defaults
// only when that instance is unreachable, so the UI never depends on it to start
async function vuetifyOptions () {
  try {
    const session = await createSession({ directoryUrl: '/simple-directory', siteInfo: !(window as any).__PUBLIC_SITE_INFO })
    return vuetifySessionOptions(session)
  } catch (err) {
    console.warn('site theme unavailable, falling back to the default one', err)
    return defaultOptions({})
  }
}

const reactiveSearchParams = createReactiveSearchParams()
const uiNotif = createUiNotif()
const vuetify = createVuetify({
  ...(await vuetifyOptions()),
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
