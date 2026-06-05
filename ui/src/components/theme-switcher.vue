<template lang="html">
  <v-menu>
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        variant="flat"
        size="small"
        class="mx-2"
        :icon="mdiThemeLightDark"
        :title="t('theme') + ': ' + t(themeLabels[current])"
      />
    </template>
    <v-list density="compact">
      <v-list-item
        v-for="th in themes"
        :key="th"
        :title="t(themeLabels[th])"
        :active="th === current"
        @click="setTheme(th)"
      />
    </v-list>
  </v-menu>
</template>

<i18n lang="yaml">
en:
  theme: "Theme"
  themeDefault: "Light"
  themeDark: "Dark"
  themeHc: "High contrast"
  themeHcDark: "High contrast dark"
fr:
  theme: "Thème"
  themeDefault: "Clair"
  themeDark: "Sombre"
  themeHc: "Contraste élevé"
  themeHcDark: "Contraste élevé sombre"
</i18n>

<script lang="ts" setup>
import { mdiThemeLightDark } from '@mdi/js'
import { $uiConfig } from '../context'

const { t } = useI18n()

export type Theme = 'default' | 'dark' | 'hc' | 'hc-dark'
const themes: Theme[] = ['default', 'dark', 'hc', 'hc-dark']
const themeLabels: Record<Theme, string> = {
  default: 'themeDefault',
  dark: 'themeDark',
  hc: 'themeHc',
  'hc-dark': 'themeHcDark'
}

const emit = defineEmits<{ change: [Theme] }>()

const current = ref<Theme>(($uiConfig.theme?.default as Theme) ?? 'default')

const writeCookie = (th: Theme) => { document.cookie = `theme=${th}; path=/` }

const setTheme = (th: Theme) => {
  current.value = th
  writeCookie(th)
  emit('change', th)
}

// set the initial cookie so the very first frame load already uses the default theme
onMounted(() => writeCookie(current.value))
</script>
