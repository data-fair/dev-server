import { assertValid, type DevServerConfig } from '../config/type/index.js'
import config from 'config'

export type { DevServerConfig } from '../config/type/index.ts'

// we reload the config instead of using the singleton from the config module for testing purposes
// @ts-ignore
const devServerConfig = process.env.NODE_ENV === 'test' ? config.util.loadFileConfigs(process.env.NODE_CONFIG_DIR, { skipConfigSources: true }) : config

assertValid(devServerConfig, { lang: 'en', name: 'config', internal: true })

export default devServerConfig as DevServerConfig
