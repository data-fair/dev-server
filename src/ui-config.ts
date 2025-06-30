import config from './config.ts'

export const uiConfig = { dataFair: config.dataFair }

export type UiConfig = typeof uiConfig
export default uiConfig
