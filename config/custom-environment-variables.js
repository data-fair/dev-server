module.exports = {
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
    script: 'APP_SCRIPT'
  },
  iframeLog: {
    __name: 'IFRAME_LOG',
    __format: 'json'
  }
}
