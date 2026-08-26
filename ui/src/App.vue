<template>
  <v-app>
    <v-app-bar>
      <!-- Show Configuration Schema -->
      <v-dialog scrollable>
        <template #activator="{props}">
          <v-btn
            v-bind="props"
            :title="t('showSchema')"
            :loading="fetchInfo.loading.value"
            :icon="mdiTextBox"
            class="mx-2"
            size="small"
            color="primary"
            variant="text"
          />
        </template>
        <v-card
          :title="t('configSchema')"
          variant="flat"
        >
          <v-card-text>
            <pre>{{ schema }}</pre>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-btn
        class="mx-2"
        size="small"
        color="primary"
        variant="text"
        :icon="mdiRefresh"
        :loading="fetchInfo.loading.value"
        :title="t('refreshAppInfo')"
        @click="fetchInfo.execute()"
      />

      <config-importer @copied="onConfigCopied" />

      <filter-tester
        :extra-params="extraParams"
        @applied="onFilterApplied"
      />

      <v-spacer />

      <screenshot-simulation
        :capture-width="meta?.['df:capture-width']"
        :capture-height="meta?.['df:capture-height']"
        :extra-params="extraParams"
      />
      <v-btn
        :title="t('reloadIframe')"
        :icon="mdiRefresh"
        class="mx-2"
        size="small"
        color="primary"
        variant="text"
        @click="draftPreviewInc++"
      />
      <v-btn
        :title="t('openFullPage')"
        :icon="mdiOpenInNew"
        class="mx-2"
        size="small"
        color="primary"
        href="/app"
        target="blank"
        variant="text"
      />
      <v-select
        v-model="frameMode"
        :items="frameModes"
        :prepend-inner-icon="mdiMonitorScreenshot"
        density="compact"
        variant="outlined"
        class="mx-2"
        max-width="300"
        hide-details
        @update:model-value="draftPreviewInc++"
      >
        <template #selection="{ item }">
          {{ t(item.labelKey) }}
        </template>
        <template #item="{ item, props: itemProps }">
          <v-tooltip :text="t(item.tooltipKey)">
            <template #activator="{ props: tipProps }">
              <v-list-item
                v-bind="mergeProps(itemProps, tipProps)"
                :title="t(item.labelKey)"
                :subtitle="item.config"
              />
            </template>
          </v-tooltip>
        </template>
      </v-select>

      <theme-switcher @change="draftPreviewInc++" />

      <lang-switcher />
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <v-row no-gutters>
          <v-col
            md="6"
            lg="4"
            class="pr-4"
            :style="configColStyle"
          >
            <h2 class="text-title-large font-weight-bold my-2">
              {{ t('config') }}
            </h2>
            <v-form
              ref="form"
              v-model="formValid"
              class="ma-2"
            >
              <v-alert
                v-if="!!compileError"
                type="error"
                :text="compileError"
              />

              <v-alert
                v-if="!!validationErrors && formValid"
                type="error"
              >
                Formulaire valide pourtant le modèle ne respecte pas le schéma:
                <p>{{ validationErrors }}</p>
              </v-alert>

              <v-defaults-provider :defaults="{ global: { hideDetails: 'auto' } }">
                <vjsf
                  v-if="schema && editConfig"
                  v-model="editConfig"
                  :schema="schema"
                  :options="vjsfOptions"
                  @update:model-value="validate"
                />
              </v-defaults-provider>
            </v-form>

            <v-row class="ma-2">
              <v-spacer />
              <v-btn
                color="warning"
                @click="empty"
              >
                {{ t('empty') }}
              </v-btn>
            </v-row>

            <v-row class="ma-2">
              <v-form>
                <vjsf
                  v-model="extraParams"
                  :schema="extraParamsSchema"
                  :options="{ editMode: 'inline' }"
                />
              </v-form>
            </v-row>

            <v-row
              v-if="meta"
              class="mt-4"
            >
              <v-col class="app-meta">
                <h2 class="text-title-large font-weight-bold mb-2">
                  {{ t('metadata') }}
                </h2>

                <v-alert
                  v-if="appFiles && !appFiles.thumbnail"
                  type="error"
                  :text="t('missingThumbnailFile')"
                  density="compact"
                  class="mb-2"
                />
                <v-alert
                  v-if="appFiles && !appFiles.configSchema"
                  type="error"
                  :text="t('missingConfigSchemaFile')"
                  density="compact"
                  class="mb-2"
                />
                <v-alert
                  v-if="metaWarnings.length"
                  type="warning"
                  class="mb-2"
                >
                  <div
                    v-for="w in metaWarnings"
                    :key="w"
                  >
                    {{ w }}
                  </div>
                </v-alert>

                <meta-item
                  v-for="field in metaFields"
                  :key="field.key"
                  :label="field.label ?? field.key"
                  :present="metaIsPresent(field)"
                  :severity="field.severity"
                  :message-key="field.messageKey"
                >
                  {{ metaDisplayValue(field) }}
                </meta-item>
                <meta-item
                  v-for="field in optionalMetaFields"
                  :key="field.key"
                  mode="optional"
                  :label="field.label ?? field.key"
                  :present="metaIsPresent(field)"
                  :severity="field.severity"
                  :message-key="field.messageKey"
                >
                  {{ metaDisplayValue(field) }}
                </meta-item>

                <template v-if="hasForbiddenMeta">
                  <h3 class="text-subtitle-1 font-weight-bold mt-4 mb-2">
                    {{ t('deprecatedMetas') }}
                  </h3>
                  <meta-item
                    v-for="field in forbiddenMetaFields"
                    :key="field.key"
                    mode="forbidden"
                    :label="field.label ?? field.key"
                    :present="metaIsPresent(field)"
                    :severity="field.severity"
                    :message-key="field.messageKey"
                  />
                </template>
              </v-col>
            </v-row>
          </v-col>

          <v-col
            md="6"
            lg="8"
          >
            <v-alert
              v-if="error"
              :text="error"
              type="error"
              border="start"
              variant="outlined"
              class="ma-4"
            />

            <d-frame
              v-else-if="showPreview && meta"
              ref="frame"
              :key="frameMode"
              class="border"
              :src="iframeUrl"
              :resize="frameResize"
              :aspect-ratio="(frameMode === 'aspect-ratio' || frameMode === 'aspect-ratio-fixed') ? '' : undefined"
              :sync-params="meta['df:sync-state'] === 'true' ? '*' : ''"
              :reload="draftPreviewInc"
              :style="{ height: frameHeight }"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<i18n lang="yaml">
en:
  metadata: "Metadata read from index.html"
  deprecatedMetas: "Deprecated or useless metadata (to remove)"
  config: "Configuration form from config-schema.json"
  showSchema: "Show schema"
  configSchema: "Config schema"
  empty: "Clear the configuration"
  refreshAppInfo: "Refresh app info"
  reloadIframe: "Reload preview"
  openFullPage: "Open in full page"
  modeFullPage: "Full page"
  modeAspectFixed: "Fixed aspect ratio"
  modeAutoResize: "Automatic resizing"
  modeLegacy: "Legacy"
  modeFullPageTip: "The app fills the container height."
  modeAspectFixedTip: "Height fixed by the aspect ratio."
  modeAutoResizeTip: "Displayed using the aspect ratio by default, and resized when needed. A map application typically won't resize; an application that declared df:overflow will resize."
  modeLegacyTip: "Previous behaviour: resizing driven by the df:overflow meta."
  missingThumbnailFile: 'No public/thumbnail.png served at the root of the app. The presence of that file is what matters: data-fair computes baseApp.image as url + "thumbnail.png". The thumbnail meta tag is never read.'
  missingConfigSchemaFile: 'No public/config-schema.json served at the root of the app (generate it from src/config/schema.json with df-build-types). Never rename nor move it.'
  duplicateTitle: 'Keep a single <title> element. Duplicating it with a lang attribute is invalid HTML and produces two W3C errors — catalog i18n goes through registry.'
  duplicateDescription: 'Keep a single <meta name="description">. Duplicating it with a lang attribute is invalid HTML and produces two W3C errors.'
  charsetMissing: 'No <meta charset> in the head. Add <meta charset="UTF-8"> as the very first element.'
  charsetNotFirst: 'The <meta charset> starts at byte {offset}, beyond the first 1024 bytes of the document. Move it to the very top of <head>: a comment block placed before it is enough to push it out of that window and break validation.'
fr:
  metadata: "Métadonnées lues depuis index.html"
  deprecatedMetas: "Métadonnées dépréciées ou inutiles (à retirer)"
  config: "Formulaire de configuration issu du config-schema.json"
  showSchema: "Voir le schéma"
  configSchema: "Schéma de configuration"
  empty: "Vider la configuration"
  refreshAppInfo: "Rafraîchir les infos de l'application"
  reloadIframe: "Recharger l'aperçu"
  openFullPage: "Ouvrir en pleine page"
  modeFullPage: "Pleine page"
  modeAspectFixed: "Aspect ratio figé"
  modeAutoResize: "Redimensionnement automatique"
  modeLegacy: "Légacy"
  modeFullPageTip: "L'application remplit la hauteur du conteneur."
  modeAspectFixedTip: "Hauteur figée par le ratio d'aspect."
  modeAutoResizeTip: "Affichée en aspect-ratio par défaut, et redimensionnée au besoin. Une application carte ne se redimensionne typiquement pas ; une application qui déclarait df:overflow se redimensionne."
  modeLegacyTip: "Ancien comportement : redimensionnement piloté par la métadonnée df:overflow."
  missingThumbnailFile: 'Aucun public/thumbnail.png servi à la racine de l''application. C''est la présence de ce fichier qui compte : data-fair calcule baseApp.image comme url + "thumbnail.png". La balise méta thumbnail n''est jamais lue.'
  missingConfigSchemaFile: 'Aucun public/config-schema.json servi à la racine de l''application (à générer depuis src/config/schema.json avec df-build-types). Ne le renommez ni ne le déplacez jamais.'
  duplicateTitle: 'Ne gardez qu''un seul élément <title>. Le dupliquer avec un attribut lang est du HTML invalide et produit deux erreurs W3C — l''i18n du catalogue passe par registry.'
  duplicateDescription: 'Ne gardez qu''une seule <meta name="description">. La dupliquer avec un attribut lang est du HTML invalide et produit deux erreurs W3C.'
  charsetMissing: 'Aucune <meta charset> dans le head. Ajoutez <meta charset="UTF-8"> tout en premier.'
  charsetNotFirst: 'La <meta charset> commence à l''octet {offset}, au-delà des 1024 premiers octets du document. Remontez-la tout en haut du <head> : un bloc de commentaire placé avant suffit à la repousser hors de cette fenêtre et à casser la validation.'
</i18n>

<script lang="ts" setup>

import { mergeProps } from 'vue'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { setProperty } from 'dot-prop'
import * as parse5 from 'parse5'
import Ajv, { ValidateFunction } from 'ajv'
import ajvFormats from 'ajv-formats'
import ajvLocalize from 'ajv-i18n'
import { $uiConfig } from './context'
import '@data-fair/frame/lib/d-frame.js'
import Vjsf, { type Options as VjsfOptions } from '@koumoul/vjsf'
import { v2compat } from '@koumoul/vjsf/compat/v2'
import { mdiOpenInNew, mdiRefresh, mdiTextBox, mdiMonitorScreenshot } from '@mdi/js'
import { ofetch } from 'ofetch'
import { isElementNode, isTextNode } from '@parse5/tools'
import { resolveLocaleRefs } from '@json-layout/core/compile'
import langSwitcher from './components/lang-switcher.vue'
import metaItem from './components/meta-item.vue'
import screenshotSimulation from './components/screenshot-simulation.vue'
import themeSwitcher from './components/theme-switcher.vue'
import configImporter from './components/config-importer.vue'
import filterTester from './components/filter-tester.vue'
import { withQuery } from 'ufo'
import { useWindowSize } from '@vueuse/core'
import debugModule from 'debug'

const debugEditConfigBinding = debugModule('dev-server:edit-config-binding')

const ajv = new Ajv({ strict: false, allErrors: true, messages: false })
ajv.addFormat('hexcolor', /^#[0-9A-Fa-f]{6,8}$/)
ajvFormats(ajv)

type Locale = 'fr' | 'en'
// "title" is the <title> element. <meta name="title"> is a different thing (it overrides
// baseApp.meta.title in data-fair) and is abandoned, so it is parsed under "meta:title" to
// keep the two apart.
type Meta = {
  title?: string,
  'meta:title'?: string,
  description?: string,
  'application-name'?: string,
  'df:overflow'?: string,
  'df:sync-state'?: string,
  'df:filter-concepts'?: string,
  'df:concept-filters'?: string,
  'df:vjsf'?: string,
  'df:sync-config'?: string,
  'df:capture-delay'?: string,
  'df:capture-width'?: string,
  'df:capture-height'?: string,
  'x-capture'?: string,
  keywords?: string,
  thumbnail?: string,
  'vocabulary-accept'?: string,
  'vocabulary-require'?: string,
  version?: string,
  '{VERSION}'?: string
}

const { t, locale } = useI18n()
const { height } = useWindowSize()

const error = ref<string>()
const schema = ref<any>()
const showPreview = ref(true)
const compileError = ref<string>()
const formValid = ref(false)
const meta = ref<Meta>()
const headStructure = ref<{ titleCount: number, descriptionCount: number, charsetOffset: number }>()
const appFiles = ref<{ thumbnail: boolean, configSchema: boolean }>()
const extraParams = ref<{ name: string, value: string }[]>()

type MetaField = {
  key: string,
  // defaults to the key, for the entries whose key is not the name of the tag
  label?: string,
  severity: 'error' | 'info' | 'warning',
  messageKey: string
}

// only the metadata actually consumed by data-fair: keywords, thumbnail, vocabulary-accept
// and vocabulary-require have no consumer anywhere (data-fair, portals, registry, capture,
// frame, lib) and must not be declared by an application anymore
const metaFields: MetaField[] = [
  { key: 'application-name', severity: 'error', messageKey: 'missingApplicationName' },
  { key: 'title', severity: 'error', messageKey: 'missingTitle' },
  { key: 'description', severity: 'error', messageKey: 'missingDesc' },
  { key: 'df:overflow', severity: 'info', messageKey: 'missingDFOverflow' },
  { key: 'df:sync-state', severity: 'info', messageKey: 'missingDFSyncState' },
  { key: 'df:filter-concepts', severity: 'info', messageKey: 'missingDFFilterConcepts' },
  { key: 'df:vjsf', severity: 'info', messageKey: 'missingDFVsf' },
  { key: 'df:sync-config', severity: 'info', messageKey: 'missingDFSyncConfig' },
  { key: 'df:capture-delay', severity: 'info', messageKey: 'missingDFCaptureDelay' }
]

// declaring them is legitimate but rare, so they are only displayed when present
const optionalMetaFields: MetaField[] = [
  { key: 'df:capture-width', severity: 'info', messageKey: 'optionalDFCaptureWidth' },
  { key: 'df:capture-height', severity: 'info', messageKey: 'optionalDFCaptureHeight' }
]

// metadata that no application should declare anymore: either deprecated or with no
// consumer anywhere in the ecosystem (data-fair, portals, registry, capture, frame, lib)
const forbiddenMetaFields: MetaField[] = [
  { key: 'x-capture', severity: 'warning', messageKey: 'forbiddenXCapture' },
  { key: 'df:concept-filters', severity: 'warning', messageKey: 'forbiddenConceptFilters' },
  { key: 'keywords', severity: 'warning', messageKey: 'forbiddenKeywords' },
  { key: 'thumbnail', severity: 'warning', messageKey: 'forbiddenThumbnailMeta' },
  { key: 'vocabulary-accept', severity: 'warning', messageKey: 'forbiddenVocabulary' },
  { key: 'vocabulary-require', severity: 'warning', messageKey: 'forbiddenVocabulary' },
  { key: 'version', severity: 'warning', messageKey: 'forbiddenVersionMeta' },
  { key: 'meta:title', label: 'title', severity: 'warning', messageKey: 'forbiddenTitleMeta' },
  { key: '{VERSION}', severity: 'warning', messageKey: 'forbiddenVersionPlaceholder' }
]

const metaIsPresent = (field: MetaField) => !!(meta.value as any)?.[field.key]

const hasForbiddenMeta = computed(() => forbiddenMetaFields.some(metaIsPresent))

const metaDisplayValue = (field: MetaField) => (meta.value as any)?.[field.key] ?? ''

// structural warnings computed from the raw index.html: duplicate title/description (invalid
// HTML, two W3C errors) and a charset pushed out of the first 1024 bytes. The byte offset is
// the actual constraint, and it is also what keeps the check usable behind a vite dev server,
// which injects its own client script at the very top of the <head>.
const CHARSET_MAX_OFFSET = 1024
const metaWarnings = computed<string[]>(() => {
  const structure = headStructure.value
  if (!structure) return []
  const warnings: string[] = []
  if (structure.titleCount > 1) warnings.push(t('duplicateTitle'))
  if (structure.descriptionCount > 1) warnings.push(t('duplicateDescription'))
  if (structure.charsetOffset < 0) warnings.push(t('charsetMissing'))
  else if (structure.charsetOffset > CHARSET_MAX_OFFSET) warnings.push(t('charsetNotFirst', { offset: structure.charsetOffset }))
  return warnings
})

let schemaValidate: ValidateFunction

const extraParamsSchema = {
  type: 'array',
  title: 'Extra query params',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      value: { type: 'string' }
    }
  }
}

const vjsfOptions = computed<VjsfOptions | null>(() => {
  const owner = $uiConfig.dataFair.owner
  let ownerFilter = `${owner.type}:${owner.id}`
  if (owner.department) ownerFilter += ':' + owner.department
  const datasetFilter = `owner=${ownerFilter}`
  const remoteServiceFilter = `privateAccess=${ownerFilter}`
  return {
    titleDepth: 4,
    density: 'comfortable',
    locale: 'fr',
    fetchBaseURL: '/data-fair/',
    context: {
      owner,
      ownerFilter,
      datasetFilter,
      remoteServiceFilter, // a pseudo attachments array, temporary until we have a real one
      attachments: [
        {
          title: 'Attachment 1',
          name: 'attachment.png',
          size: 4705,
          mimetype: 'image/png',
          updatedAt: '2025-01-15T09:00:48.787Z'
        }
      ]
    },
    updateOn: 'blur',
    initialValidation: 'always',
  }
})

const validationErrors = computed(() => {
  if (!schema.value || !schemaValidate) return
  debugEditConfigBinding('validate editConfig')
  const valid = schemaValidate(editConfig.value)
  debugEditConfigBinding('valid ?', valid)
  if (!valid) {
    ajvLocalize[locale.value as Locale](schemaValidate.errors)
    return schemaValidate.errors
  }
  return null
})

const iframeExtraParams = computed(() => {
  const base: Record<string, string> = { draft: 'true' }
  const primary = $uiConfig.site?.primaryColor
  if (primary) base.primary = primary
  return (extraParams.value ?? [])
    .filter(p => p.name && p.value)
    .reduce((a, p) => { a[p.name] = p.value; return a }, base)
})
const iframeUrl = computed(() => {
  return withQuery('/app', iframeExtraParams.value)
})

const fetchConfig = useFetch('/config')
const editConfig = ref<any>()
watch(fetchConfig.data, (v) => {
  debugEditConfigBinding('update editConfig from fetchConfig')
  editConfig.value = v
})
if (debugEditConfigBinding.enabled) {
  watch(editConfig, () => {
    debugEditConfigBinding('editConfig watcher', JSON.parse(JSON.stringify(editConfig.value)))
  })
}

const socketDevServer = new ReconnectingWebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`)
socketDevServer.onopen = () => {
  socketDevServer.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'app-error') {
      error.value = data.data.message
    }
  }
}

window.addEventListener('message', async msg => {
  console.log('received message from iframe', msg.data)
  // @ts-ignore
  if (frame.value?.iframeElement?.contentWindow === msg.source && msg.data.type === 'set-config') {
    debugEditConfigBinding('set property from iframe', msg.data.content.field, msg.data.content.value)
    editConfig.value = setProperty(JSON.parse(JSON.stringify(toRaw(editConfig.value))), msg.data.content.field, msg.data.content.value)
    await validate()
  }
})

const empty = async () => {
  debugEditConfigBinding('empty editConfig')
  editConfig.value = null
  await save({})
  editConfig.value = {}
}

const form = useTemplateRef('form')
const validate = async () => {
  await form.value?.validate()
  if (formValid.value) {
    await save(editConfig.value)
    error.value = undefined
  }
}

const frame = useTemplateRef('frame')
const save = async (config: any, resetUrl = false) => {
  debugEditConfigBinding('save config', config)
  await ofetch('/config' + (resetUrl ? '?resetUrl=true' : ''), { body: config, method: 'put' })
  if (resetUrl) {
    // a copied configuration replaces the whole config, so reset the query params of
    // the dev-server URL (they mirror the state of the previous configuration) and
    // reload the page: the form is then recreated from the new config (avoiding any
    // stale state in the form) and the app preview reloads with a clean URL
    extraParams.value = []
    const url = new URL(window.location.href)
    url.search = ''
    history.replaceState(null, '', url)
    window.location.reload()
    return
  }
  if (meta.value?.['df:sync-config'] === 'true') {
    debugEditConfigBinding('send new config to iframe')
    // @ts-ignore
    frame.value?.postMessageToChild({ type: 'set-config', content: toRaw(config) })
  } else {
    draftPreviewInc.value++
  }
}

const onConfigCopied = async (configuration: any) => {
  debugEditConfigBinding('copy remote configuration')
  await save(configuration, true)
}

// apply or remove a concept (_c_) / dataset (_d_) filter param on the preview URL, so the app
// under development reads it through reactiveSearchParams / useConceptFilters.
// Deliberately no draftPreviewInc: changing the src is enough, d-frame pushes it to the child
// with an updateSrc message — exactly what a dashboard or a portal parent does. Forcing a
// reload on top would race with it, d-frame reloading the iframe on its previous URL.
const onFilterApplied = (key: string, value: string) => {
  extraParams.value = (extraParams.value ?? []).filter(p => p.name !== key)
  if (value) extraParams.value.push({ name: key, value })
}

const appFileExists = async (path: string) => {
  try {
    const res = await ofetch.raw(path, { method: 'HEAD', ignoreResponseError: true })
    return res.status >= 200 && res.status < 400
  } catch (err) {
    console.warn('failed to probe ' + path, err)
    return true // do not raise a false alarm when the app server is unreachable
  }
}

const fetchInfo = useAsyncAction(async () => {
  // read meta from index.html
  const htmlText = await ofetch<string>('/app/index.html')
  const document = parse5.parse(htmlText)
  const html = document.childNodes.filter(isElementNode).find(c => c.tagName === 'html')
  if (!html) throw new Error('broken HTML')
  const head = html.childNodes.filter(isElementNode).find(c => c.tagName === 'head')
  if (!head) throw new Error('broken HTML, missing head tag')

  // a single <title> and a single <meta name="description">: duplicating them with a lang
  // attribute is invalid HTML, and data-fair only ever reads one value
  const parsedMeta: any = {}
  const titleNodes = head.childNodes.filter(isElementNode).filter(c => c.tagName === 'title')
  if (titleNodes[0]) parsedMeta.title = titleNodes[0].childNodes.filter(isTextNode)[0]?.value

  // "title" is deliberately absent: it is the <title> element above. <meta name="title">
  // is parsed under "meta:title", it is a deprecated metadata of its own.
  const metaTags = ['application-name', 'description', 'df:overflow', 'df:sync-state', 'df:filter-concepts', 'df:concept-filters', 'df:vjsf', 'df:sync-config', 'df:capture-delay', 'df:capture-width', 'df:capture-height', 'x-capture', 'keywords', 'thumbnail', 'vocabulary-accept', 'vocabulary-require', 'version', '{VERSION}']

  let descriptionCount = 0
  for (const node of head.childNodes.filter(isElementNode)) {
    if (node.tagName !== 'meta') continue
    const name = node.attrs.find(a => a.name === 'name')?.value
    const content = node.attrs.find(a => a.name === 'content')?.value
    if (!name || !content) continue
    if (name === 'description') descriptionCount++
    const key = name === 'title' ? 'meta:title' : name
    if (key !== 'meta:title' && !metaTags.includes(key)) continue
    parsedMeta[key] = parsedMeta[key] ?? content
  }

  // the constraint on <meta charset> is a byte offset, not a node position: measuring it on
  // the raw text also covers the comment-before-charset case, and does not false-positive on
  // the client script a vite dev server injects at the top of the <head>.
  const charsetMatch = /<meta[^>]+charset\s*=/i.exec(htmlText)
  meta.value = parsedMeta
  headStructure.value = {
    titleCount: titleNodes.length,
    descriptionCount,
    charsetOffset: charsetMatch ? new TextEncoder().encode(htmlText.slice(0, charsetMatch.index)).length : -1
  }

  // data-fair reads thumbnail.png over HTTP (baseApp.url + "thumbnail.png"), so probe it the
  // same way through the app proxy rather than looking at the filesystem
  appFiles.value = {
    thumbnail: await appFileExists('/app/thumbnail.png'),
    configSchema: await appFileExists('/app/config-schema.json')
  }

  // fetch config schema
  schema.value = undefined
  const newSchema = await ofetch('/app/config-schema.json')
  // same default as the data-fair config form, cf. completeSchema in application-config.vue
  if (!newSchema.layout?.comp) newSchema.layout = 'expansion-panels'

  newSchema.$id = newSchema.$id ?? 'config-schema'
  resolveLocaleRefs(newSchema, ajv, locale.value, 'fr')
  schema.value = meta.value?.['df:vjsf'] === '3' ? newSchema : v2compat(newSchema)
  try {
    ajv.removeSchema(newSchema.$id)
    schemaValidate = ajv.compile(schema.value)
    compileError.value = undefined
  } catch (err: any) {
    console.error(err)
    compileError.value = err.message
  }
})
fetchInfo.execute()

const draftPreviewInc = ref(0)

const frameModes = [
  { value: 'fill-height', labelKey: 'modeFullPage', config: 'fill-height · resize=no', tooltipKey: 'modeFullPageTip' },
  { value: 'aspect-ratio-fixed', labelKey: 'modeAspectFixed', config: 'aspect-ratio · resize=no', tooltipKey: 'modeAspectFixedTip' },
  { value: 'aspect-ratio', labelKey: 'modeAutoResize', config: 'aspect-ratio · resize=auto', tooltipKey: 'modeAutoResizeTip' },
  { value: 'legacy', labelKey: 'modeLegacy', config: 'df:overflow → resize', tooltipKey: 'modeLegacyTip' }
]
const frameMode = ref('fill-height')

const frameResize = computed(() => {
  if (frameMode.value === 'aspect-ratio-fixed' || frameMode.value === 'fill-height') return 'no'
  if (frameMode.value === 'legacy') return meta.value?.['df:overflow'] === 'true' ? 'auto' : 'no'
  return undefined
})

// viewport height minus the app-bar (64) and the container's top+bottom paddings (16+16)
const availableHeight = computed(() => height.value - 64 - 32)

const frameHeight = computed<string | undefined>(() => {
  if (frameMode.value === 'legacy' || frameMode.value === 'fill-height') return availableHeight.value + 'px'
  return undefined // aspect-ratio modes compute their own height
})

// in fill-height mode the config column must be bounded to the same height and scroll
// internally, otherwise its natural height makes the whole page scroll
const configColStyle = computed<Record<string, string> | undefined>(() => {
  if (frameMode.value !== 'fill-height') return undefined
  return { height: availableHeight.value + 'px', overflowY: 'auto' }
})

</script>
