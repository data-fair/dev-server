import config from './config.js'

export const uiConfig = {
  dataFair: config.dataFair,
  site: config.site,
  theme: config.theme,
  lang: config.lang
}

export type UiConfig = typeof uiConfig
export default uiConfig
