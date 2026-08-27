export default {
  port: {
    __name: 'DEV_SERVER_PORT',
    // __format, otherwise the config module hands over the raw string: the declared type is a
    // number, and ajv cannot coerce it back since the config object is frozen before assertValid.
    __format: 'json'
  },
  dataFair: {
    url: 'DATAFAIR_URL',
    owner: {
      type: 'DATAFAIR_OWNER_TYPE',
      id: 'DATAFAIR_OWNER_ID',
      department: 'DATAFAIR_OWNER_DEPARTMENT'
    },
    apiKey: 'DATAFAIR_API_KEY'
  },
  app: {
    url: 'APP_URL',
    proxyPaths: {
      __name: 'APP_PROXY_PATHS',
      __format: 'json'
    },
  },
  site: {
    primaryColor: 'SITE_PRIMARY_COLOR'
  },
  theme: {
    default: 'THEME_DEFAULT'
  },
  lang: {
    default: 'LANG_DEFAULT'
  }
}
