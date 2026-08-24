import { createApp } from 'vue'
// global.scss REPLACES 'vuetify/styles' — never both. It compiles Vuetify with
// $body-font-family: var(--d-body-font-family), the variable set by _theme.css.
import '@data-fair/lib-vuetify/style/global.scss'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createI18n } from 'vue-i18n'
import { vuetifySessionOptions } from '@data-fair/lib-vuetify'
import { createSession } from '@data-fair/lib-vue/session.js'
import { createUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { createLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import '@data-fair/frame/lib/d-frame'
import { createConfig } from './composables/config'
import App from './App.vue'

// Expose reactiveSearchParams to the v-iframe-compat shim injected by DataFair, so that a
// parent d-frame updating our src applies the new params instead of reloading the iframe.
// It has to be the SAME object the components read: importing the module level singleton and
// also installing createReactiveSearchParams() would create two unrelated reactive states,
// and the shim would write in the one nobody reads.
;(window as any).vIframeOptions = { reactiveParams: reactiveSearchParams }

async function init () {
  // siteInfo: true is mandatory, vuetifySessionOptions throws without session.site.value
  const session = await createSession({ directoryUrl: '/simple-directory', siteInfo: true })
  // legacy: false, otherwise vue-i18n 11 starts in the legacy mode, removed in v12.
  // fallbackLocale: simple-directory serves fr/en/es/pt/it/de, our messages only fr/en.
  const i18n = createI18n({ legacy: false, locale: session.state.lang, fallbackLocale: 'en' })
  const localeDayjs = createLocaleDayjs(session.state.lang)
  const vuetify = createVuetify({
    ...vuetifySessionOptions(session),
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } }
  })

  createApp(App)
    .use(session)
    .use(i18n)
    .use(localeDayjs)
    .use(vuetify)
    .use(createUiNotif())
    .use(createConfig())
    .mount('#app')
}

init()
