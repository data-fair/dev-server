import { createApp } from 'vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createI18n } from 'vue-i18n'
import { vuetifySessionOptions } from '@data-fair/lib-vuetify'
import { createSession } from '@data-fair/lib-vue/session.js'
import { createLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import { createReactiveSearchParams } from '@data-fair/lib-vue/reactive-search-params.js'
import '@data-fair/frame/lib/d-frame'
import { createConfig } from './composables/config'
import App from './App.vue'

async function init () {
  const session = await createSession({ directoryUrl: '/simple-directory', siteInfo: true })
  const i18n = createI18n({ locale: session.state.lang })
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
    .use(createConfig())
    .use(createReactiveSearchParams())
    .mount('#app')
}

init()
