<template>
  <v-dialog
    v-model="dialog"
    max-width="1200"
    scrollable
  >
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :title="t('title')"
        :icon="mdiCamera"
        class="mx-2"
        size="small"
        color="primary"
        variant="text"
      />
    </template>

    <v-card
      :title="t('title')"
      variant="flat"
    >
      <v-card-text>
        <p class="mb-2">
          {{ t('intro') }}
        </p>

        <v-row class="align-center">
          <v-col
            cols="12"
            md="5"
          >
            <v-select
              v-model="context"
              :items="contextItems"
              :label="t('context')"
              :hint="context === 'thumbnail' ? t('thumbnailHint') : t('manualHint')"
              persistent-hint
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col
            cols="12"
            md="3"
          >
            <v-select
              v-model="format"
              :items="formatItems"
              :label="t('format')"
              :hint="format === 'png' ? t('pngHint') : t('gifHint')"
              persistent-hint
              density="compact"
              variant="outlined"
            />
          </v-col>
          <v-col
            cols="6"
            md="2"
          >
            <v-text-field
              :model-value="width"
              :label="t('width')"
              :disabled="context === 'thumbnail'"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="v => manualWidth = Number(v)"
            />
          </v-col>
          <v-col
            cols="6"
            md="2"
          >
            <v-text-field
              :model-value="height"
              :label="t('height')"
              :disabled="context === 'thumbnail'"
              type="number"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="v => manualHeight = Number(v)"
            />
          </v-col>
        </v-row>

        <div
          v-if="context === 'manual'"
          class="mb-2"
        >
          <v-btn
            v-for="preset in sizePresets"
            :key="preset.label"
            size="x-small"
            variant="tonal"
            class="mr-2"
            @click="manualWidth = preset.width; manualHeight = preset.height"
          >
            {{ preset.label }}
          </v-btn>
        </div>

        <v-alert
          v-if="context === 'manual' && !stateParamsCount"
          type="info"
          density="compact"
          class="mb-2"
          :text="t('noStateParams')"
        />
        <v-alert
          v-else-if="context === 'manual'"
          type="info"
          density="compact"
          class="mb-2"
        >
          {{ t('forwardedParams') }} <code>{{ appPrefixedParams }}</code>
        </v-alert>

        <p class="text-caption mb-2">
          <code>{{ captureUrl }}</code>
        </p>

        <!-- the frame keeps the exact requested size, the container scrolls: shrinking it to fit
             would silently show the app at a width it will never be captured at -->
        <div style="overflow-x: auto;">
          <d-frame
            :key="captureUrl + ':' + width + 'x' + height"
            :style="`border: 1px solid grey;width: ${width}px;`"
            :height="height + 'px'"
            resize="no"
            :src="captureUrl"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  title: "Simulate a screenshot"
  intro: "The dev server injects a fake window.triggerCapture reproducing the waiting strategy of the capture service. Everything it reports is prefixed [capture] in the console."
  context: "Context"
  contextThumbnail: "Default thumbnail"
  contextManual: "Manual capture"
  thumbnailHint: "1050x450 hardcoded in data-fair, ?thumbnail=true, no state param."
  manualHint: "Back-office dialog or portal button: triggerCapture, no ?thumbnail, app_* state."
  format: "Format"
  pngHint: "triggerCapture resolves false."
  gifHint: "triggerCapture(true) resolves true, animateCaptureFrame is polled."
  width: "Width"
  height: "Height"
  noStateParams: "No state in the preview URL: a capture can only restore what is in the query params. Move the state to reactiveSearchParams to make it capturable."
  forwardedParams: "The service would receive, and unprefix:"
fr:
  title: "Simuler une capture d'écran"
  intro: "Le serveur de dev injecte un faux window.triggerCapture reproduisant la stratégie d'attente du service de capture. Tout ce qu'il signale est préfixé [capture] dans la console."
  context: "Contexte"
  contextThumbnail: "Vignette par défaut"
  contextManual: "Capture manuelle"
  thumbnailHint: "1050x450 codé en dur dans data-fair, ?thumbnail=true, aucun paramètre d'état."
  manualHint: "Dialogue du back-office ou bouton portail : triggerCapture, pas de ?thumbnail, état en app_*."
  format: "Format"
  pngHint: "triggerCapture résout false."
  gifHint: "triggerCapture(true) résout true, animateCaptureFrame est appelée en boucle."
  width: "Largeur"
  height: "Hauteur"
  noStateParams: "Aucun état dans l'URL de l'aperçu : une capture ne peut restituer que ce qui est dans les paramètres de requête. Portez l'état dans reactiveSearchParams pour le rendre capturable."
  forwardedParams: "Le service recevrait, et dé-préfixerait :"
</i18n>

<script lang="ts" setup>
import { mdiCamera } from '@mdi/js'
import { withQuery } from 'ufo'

const { t } = useI18n()

const props = defineProps<{
  // df:capture-width / df:capture-height, they prefill the back-office dialog and the portal button
  captureWidth?: string
  captureHeight?: string
  // filters and other params pushed on the preview URL from the dev-server UI itself
  extraParams?: { name: string, value: string }[]
}>()

const dialog = ref(false)
const context = ref<'thumbnail' | 'manual'>('thumbnail')
const format = ref<'png' | 'gif'>('png')
const manualWidth = ref<number>()
const manualHeight = ref<number>()

const contextItems = computed(() => [
  { title: t('contextThumbnail'), value: 'thumbnail' },
  { title: t('contextManual'), value: 'manual' }
])
const formatItems = [{ title: 'png', value: 'png' }, { title: 'gif', value: 'gif' }]

// the three defaults of the stack, cf. references/capture.md § 4
const sizePresets = computed(() => [
  { label: '800x450 (' + t('contextManual') + ')', width: 800, height: 450 },
  { label: '1280x720 (portail)', width: 1280, height: 720 },
  { label: '1050x450 (' + t('contextThumbnail') + ')', width: 1050, height: 450 }
])

// data-fair hardcodes 1050x450 for the default thumbnail and ignores df:capture-* there ;
// the back-office dialog prefills with the metas, defaulting to 800x450
const width = computed(() => context.value === 'thumbnail' ? 1050 : (manualWidth.value ?? (Number(props.captureWidth) || 800)))
const height = computed(() => context.value === 'thumbnail' ? 450 : (manualHeight.value ?? (Number(props.captureHeight) || 450)))

// the state a real capture would carry: everything the app pushed to the dev-server URL through
// sync-params, plus the filters applied from the filter tester. Read on open, the parent URL is
// rewritten with replaceState and emits no event.
const stateParams = ref<Record<string, string>>({})
watch(dialog, (open) => {
  if (!open) return
  const params: Record<string, string> = {}
  for (const [key, value] of new URLSearchParams(window.location.search)) params[key] = value
  for (const param of props.extraParams ?? []) {
    if (param.name && param.value) params[param.name] = param.value
  }
  stateParams.value = params
})
const stateParamsCount = computed(() => Object.keys(stateParams.value).length)

// what data-fair / the portal would actually send to the capture service, before it unprefixes
const appPrefixedParams = computed(() => Object.keys(stateParams.value).map(key => 'app_' + key).join(' '))

const captureUrl = computed(() => {
  // ?capture is a dev-server switch, it has no equivalent in production: there the two contexts
  // are told apart by the absence of ?thumbnail=true and the type is decided by the caller.
  const params: Record<string, string> = { capture: format.value }
  if (context.value === 'thumbnail') params.thumbnail = 'true'
  else Object.assign(params, stateParams.value)
  return withQuery('/app', params)
})
</script>
