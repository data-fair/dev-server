import { ofetch } from 'ofetch'
import type { UiConfig } from '../../src/ui-config'

export const $uiConfig = (window as any).__UI_CONFIG as UiConfig
