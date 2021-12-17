let config = require('config')

if (process.argv.slice(-1)[0] === 'generate') {
  const nuxtConfigInject = require('@koumoul/nuxt-config-inject')
  config = nuxtConfigInject.prepare(config)
}

const locales = ['en', 'fr']

module.exports = {
  ssr: false,
  components: true,
  srcDir: 'public/',
  telemetry: false,
  modules: ['@nuxtjs/axios', ['@nuxtjs/i18n', {
    seo: false,
    locales,
    defaultLocale: 'en',
    vueI18nLoader: true,
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_lang'
    },
    vueI18n: {
      fallbackLocale: 'en'
    }
  }]],
  axios: {
    browserBaseURL: 'http://localhost:5888/data-fair'
  },
  buildModules: ['@nuxtjs/vuetify'],
  vuetify: {
    theme: {
      themes: {
        light: {
          primary: '#1E88E5', // colors.blue.darken1
          accent: '#F57C00', // colors.orange.darken2
          warning: '#F57C00' // colors.orange.darken2
        }
      }
    }
  },
  env: { app: config.app, dataFair: config.dataFair, iframeLog: config.iframeLog, locales },
  head: {
    title: 'DataFair - Dev server',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'application', name: 'application-name', content: 'DataFair - Dev server' },
      { hid: 'description', name: 'description', content: 'A development server for optimal development experience of data-fair applications.' },
      { hid: 'robots', name: 'robots', content: 'noindex' }
    ]
  }
}
