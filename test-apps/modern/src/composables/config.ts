import { inject, reactive, toRefs, type App, type Ref } from 'vue'
import type { Config } from '../config'

export interface ConfigState {
  config: Ref<Config>
  setConfig: (c: Config) => void
}

function getConfig (): Config {
  const application = (window as any).APPLICATION
  return application?.configuration ?? {} as Config
}

export function createConfig () {
  const state = reactive<{ config: Config }>({ config: getConfig() })
  const setConfig = (newConfig: Config) => { state.config = newConfig }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'set-config' && event.data?.content) {
      const content = event.data.content
      if (content.configuration) setConfig(content.configuration)
      else if (content.field && 'value' in content) {
        const c = JSON.parse(JSON.stringify(state.config))
        ;(c as any)[content.field] = content.value
        setConfig(c)
      } else setConfig(content)
    }
  })

  const refs = toRefs(state) as unknown as ConfigState
  refs.setConfig = setConfig
  return { install (app: App) { app.provide('data-fair-app-config', refs) } }
}

export function useConfig (): ConfigState {
  const c = inject<ConfigState>('data-fair-app-config')
  if (!c) throw new Error('useConfig requires the createConfig plugin')
  return c
}

export function useApplication () {
  return (window as any).APPLICATION as { href: string; title: string; configuration: Config }
}
export default useConfig
