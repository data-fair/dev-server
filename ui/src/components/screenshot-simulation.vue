<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="1100px"
  >
    <template #activator="{props}">
      <v-btn
        class="mx-2"
        size="small"
        color="primary"
        variant="text"
        :icon="mdiCamera"
        :title="t('simulateScreenshot')"
        v-bind="props"
      />
    </template>
    <v-card variant="flat">
      <v-card-title primary-title>
        {{ t('title') }}
      </v-card-title>
      <v-card-text>
        <p>{{ t('p1') }}</p>
        <p>{{ t('p2') }}</p>
        <p>{{ t('p3') }}</p>
        <p>{{ t('p4') }}</p>
        <p>{{ t('p5') }}</p>
        <d-frame
          v-if="dialog"
          style="border: 1px solid grey;width: 1050px;"
          :aspect-ratio="21/9"
          resize="false"
          :src="screenshotUrl"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  simulateScreenshot: "Simulate screenshot"
  title: "Screenshot simulation"
  p1: "Data Fair will automatically render the visualization after each configuration change and take a screenshot to be used as a thumbnail."
  p2: "The screenshot for the thumbnail will be rendered in a box of 1050x450 pixels (21/9 resolution) and the URL will have the query parameter ?thumbnail=true."
  p3: "Screenshots can also be created manually, including with a state persisted in query parameters (see the df:sync-state meta). Animated screenshots can also be exported to gif files."
  p4: "Portals will look for the metas df:capture-width and df:capture-height to choose default screenshot sizes."
  p5: "For performance it is recommended to call the window.triggerCapture method as soon as the application is fully rendered. For guidance look for messages prefixed with \"[capture]\" in your browser developer's console."
fr:
  simulateScreenshot: "Simuler une capture"
  title: "Simulation de capture"
  p1: "Data Fair effectue automatiquement le rendu de la visualisation après chaque changement de configuration et prend une capture utilisée comme vignette."
  p2: "La capture pour la vignette est rendue dans un cadre de 1050x450 pixels (résolution 21/9) et l'URL porte le paramètre ?thumbnail=true."
  p3: "Les captures peuvent aussi être créées manuellement, y compris avec un état persisté dans les paramètres d'URL (voir la métadonnée df:sync-state). Les captures animées peuvent également être exportées en fichiers gif."
  p4: "Les portails recherchent les métadonnées df:capture-width et df:capture-height pour choisir les tailles de capture par défaut."
  p5: "Pour la performance, il est recommandé d'appeler la méthode window.triggerCapture dès que l'application est entièrement rendue. Pour vous guider, cherchez les messages préfixés par \"[capture]\" dans la console développeur de votre navigateur."
</i18n>

<script lang="ts" setup>
import { mdiCamera } from '@mdi/js'
import { withQuery } from 'ufo'

const { t } = useI18n()
const dialog = ref(false)

// reproduce the capture service behaviour (api/src/misc/utils/capture.ts): it opens
// the app at /app?thumbnail=true and forwards any app_<key> param to <key> on the
// target URL, so the app can render in a specific state for the screenshot
const screenshotUrl = computed(() => {
  const params: Record<string, string> = { thumbnail: 'true' }
  const searchParams = new URLSearchParams(window.location.search)
  for (const key of searchParams.keys()) {
    if (key.startsWith('app_')) {
      const value = searchParams.get(key)
      if (value) params[key.replace('app_', '')] = value
    }
  }
  return withQuery('/app', params)
})
</script>

<style lang="css" scoped>
p {
  margin-bottom: 8px;
}
</style>
