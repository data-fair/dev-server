export default {
  port: 5888,
  dataFair: {
    url: 'https://koumoul.com/data-fair',
    owner: {
      type: 'organization',
      id: '5a5dc47163ebd4a6f438589b',
      department: null
    },
    apiKey: null
  },
  app: {
    // Derived from the app port so that a shifted dev setup cannot desynchronize the two.
    // Path defaults to /app/: 27 of the 37 applications are Vite apps served under it, and
    // this is the only value that works in a fresh clone that never ran df-dev-env. An
    // application served at the root opts out with APP_PATH= (empty string is not nullish,
    // so ?? keeps it). APP_URL still overrides it entirely, for apps not served on localhost.
    url: `http://localhost:${process.env.APP_PORT ?? 3000}${process.env.APP_PATH ?? '/app/'}`,
    proxyPaths: ['/_nuxt/']
  },
  site: {
    primaryColor: '#1e88e5'
  },
  theme: {
    default: 'default'
  },
  lang: {
    default: 'fr'
  },
  serveUi: true
}
