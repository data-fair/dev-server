<template>
  <v-container
    fluid
    class="pt-4"
  >
    <v-row>
      <v-col
        class="xs"
        md="6"
        lg="4"
      >
        <v-alert
          v-if="error"
          color="error"
        >
          {{ error }}
        </v-alert>
        <v-row class="mb-2">
          <v-spacer />
          <v-btn
            class="mx-2"
            size="small"
            color="primary"
            :icon="mdiRefresh"
            :loading="loading"
            @click="fetchInfo"
          />
        </v-row>
        <h2 class="text-h6 mt-2">
          {{ t('config') }}
        </h2>
        <v-form
          ref="form"
          v-model="formValid"
        >
          <v-alert
            :value="!!compileError"
            type="error"
          >
            {{ compileError }}
          </v-alert>
          <v-alert
            :value="!!validationErrors && formValid"
            type="error"
          >
            Formulaire valide pourtant le modèle ne respecte pas le schéma:
            <p>{{ validationErrors }}</p>
          </v-alert>
          <vjsf
            v-if="schema && editConfig && !loading"
            v-model="editConfig"
            :schema="schema"
            :options="vjsfOptions"
            @change="validate"
          />
        </v-form>
        <v-row class="ma-2">
          <v-spacer />
          <v-btn
            color="warning"
            @click="empty"
          >
            Empty
          </v-btn>
        </v-row>

        <v-row class="ma-2">
          <v-jsf
            v-model="extraParams"
            :schema="extraParamsSchema"
            :options="{ editMode: 'inline' }"
          />
        </v-row>

        <v-row
          v-if="meta"
          class="mt-4"
        >
          <v-col class="app-meta">
            <h2 class="text-h6">
              {{ t('metadata') }}
            </h2>

            <p v-if="meta['application-name']">
              <b>application-name:</b> {{ meta['application-name'] }}
            </p>
            <v-alert
              v-else
              type="error"
              density="compact"
            >
              {{ t('missingApplicationName') }}
            </v-alert>

            <p v-if="meta.thumbnail">
              <b>thumbnail:</b> <img
                width="25"
                :src="meta.thumbnail.startsWith('http://') || meta.thumbnail.startsWith('https://') ? meta.thumbnail : '/app/' + meta.thumbnail"
              >
            </p>
            <v-alert
              v-else
              type="error"
              density="compact"
            >
              {{ t('missingThumbnail') }}
            </v-alert>

            <p v-if="meta.title && meta.title[locale]">
              <b>title:</b> {{ meta.title[locale] }}
            </p>
            <v-alert
              v-else
              type="error"
              density="compact"
            >
              {{ t('missingTitle', {locale: locale}) }}
            </v-alert>

            <p v-if="meta.description && meta.description[locale]">
              <b>description:</b> {{ meta.description[locale] }}
            </p>
            <v-alert
              v-else
              type="error"
              density="compact"
            >
              {{ t('missingDesc', {locale: locale}) }}
            </v-alert>

            <p v-if="meta.keywords && meta.keywords[locale]">
              <b>keywords:</b> {{ meta.keywords[locale] }}
            </p>
            <v-alert
              v-else
              type="error"
              density="compact"
            >
              {{ t('missingKeywords', {locale: locale}) }}
            </v-alert>

            <p v-if="meta['vocabulary-accept']">
              <b>vocabulary-accept:</b> {{ meta['vocabulary-accept'] }}
            </p>
            <v-alert
              v-else
              type="info"
              density="compact"
            >
              {{ t('missingVocabAccept', {locale: locale}) }}
            </v-alert>

            <p v-if="meta['vocabulary-require']">
              <b>vocabulary-require:</b> {{ meta['vocabulary-require'] }}
            </p>
            <v-alert
              v-else
              type="info"
              density="compact"
            >
              {{ t('missingVocabRequire', {locale: locale}) }}
            </v-alert>
            <p v-if="meta['df:overflow']">
              <b>df:overflow:</b> {{ meta['df:overflow'] }}
            </p>
            <v-alert
              v-else
              type="info"
              density="compact"
            >
              {{ t('missingDFOverflow', {locale: locale}) }}
            </v-alert>

            <p v-if="meta['df:sync-state']">
              <b>df:sync-state:</b> {{ meta['df:sync-state'] }}
            </p>
            <v-alert
              v-else
              type="info"
              density="compact"
            >
              {{ t('missingDFSyncState', {locale: locale}) }}
            </v-alert>

            <p v-if="meta['df:filter-concepts']">
              <b>df:filter-concepts:</b> {{ meta['df:filter-concepts'] }}
            </p>
            <v-alert
              v-else
              type="info"
              density="compact"
            >
              {{ t('missingDFFilterConcepts', {locale: locale}) }}
            </v-alert>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        class="xs"
        md="6"
        lg="8"
      >
        <v-row class="mb-2">
          <v-spacer />
          <screenshot-simulation />
          <v-btn
            class="mx-2"
            size="small"
            color="primary"
            title="reload iframe content"
            :icon="mdiRefresh"
            @click="reloadIframe"
          />
          <v-btn
            class="mx-2"
            size="small"
            color="primary"
            href="/app"
            title="open in full page"
            target="blank"
            :icon="mdiOpenInNew"
          />
          <lang-switcher />
        </v-row>
        <v-card>
          <v-iframe
            v-if="showPreview && meta"
            src="/app"
            :log="iframeLog"
            :iframe-resizer="meta['df:overflow'] === 'true'"
            :sync-state="meta['df:sync-state'] === 'true'"
            :query-params-extra="iframeExtraParams"
          />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<i18n lang="yaml">
en:
  metadata: Metadata read from index.html
  missingApplicationName: "Metadata \"application-name\" is missing. Add a tag <meta name=\"application-name\" content=\"my-application\">"
  missingThumbnail: "Metadata \"thumbnail\" is missing. Add a tag <meta name=\"thumbnail\" content=\"http://my/thumbnail.png\">"
  missingTitle: "Add a tag <title lang=\"{locale}\">My title</title>"
  missingDesc: "Metadata \"description\" is missing. Add a tag <meta name=\"description\" lang=\"{locale}\" content=\"My description\">"
  missingKeywords: "Metadata \"keywords\" is missing. Add a tag <meta name=\"keywords\" lang=\"{locale}\" content=\"My keyword\">"
  missingVocabAccept: "Metadata \"vocabulary-accept\" is missing. Add a tag <meta name=\"vocabulary-accept\" content=\"http://www.w3.org/2000/01/rdf-schema#label\">"
  missingVocabRequire: "Metadata \"vocabulary-require\" is missing. Add a tag <meta name=\"vocabulary-require\" content=\"http://www.w3.org/2003/01/geo/wgs84_pos#lat_long\">"
  missingDFOverflow: "Metadata \"df:overflow\" is missing. Set it to \"true\" to signify that the application might overflow its initial boundaries and require either resizing of these boundaries or scroll bars."
  missingDFSyncState: "Metadata \"df:sync-state\" is missing. Set it to \"true\" to signify that the application can have some state synchronized in its url (path and query params) that might be used by portals to create more useful links and screenshots."
  missingDFFilterConcepts: "Metadata \"df:filter-concepts\" is missing. Set it to \"true\" to signify that the application supports filtering its datasets based on concepts values."
  config: Configuration form created from config-schema.json
</i18n>

<script lang="ts" setup>

import { ref, computed, watch } from 'vue'
import ReconnectingWebSocket from 'reconnecting-websocket'
import { setProperty } from 'dot-prop'
// import ScreenshotSimulation from '~/components/screenshot-simulation.vue'
import * as parse5 from 'parse5'
import Ajv, { ValidateFunction } from 'ajv'
import ajvFormats from 'ajv-formats'
import ajvLocalize from 'ajv-i18n'
import { $uiConfig } from './context'
import { useI18n } from 'vue-i18n'
import '@data-fair/frame/lib/d-frame.js'
import Vjsf, { type Options as VjsfOptions } from '@koumoul/vjsf'
// import { v2compat } from '@koumoul/vjsf/compat/v2'
import { mdiOpenInNew, mdiRefresh } from '@mdi/js'
import { ofetch } from 'ofetch'
import { isElementNode, isTextNode } from '@parse5/tools'
import { resolveLocaleRefs } from '@json-layout/core/compile'
import langSwitcher from './components/lang-switcher.vue'
import screenshotSimulation from './components/screenshot-simulation.vue'

const ajv = new Ajv({ strict: false, allErrors: true, messages: false })
ajv.addFormat('hexcolor', /^#[0-9A-Fa-f]{6,8}$/)
ajvFormats(ajv)

type Locale = 'fr' | 'en'
type Meta = {
  title?: Record<string, string>,
  description?: Record<string, string>,
  keywords?: Record<string, string>,
  'application-name'?: string,
  'vocabulary-accept'?: string,
  'vocabulary-require'?: string,
  thumbnail?: string,
  'df:overflow'?: string,
  'df:sync-state'?: string,
  'df:filter-concepts'?: string
}

const { t, locale } = useI18n()

const error = ref<string>()
const schema = ref<any>()
const showPreview = ref(true)
const compileError = ref<string>()
const formValid = ref(false)
const iframeLog = ref(false)
const loading = ref(false)
const meta = ref<Meta>()
const extraParams = ref<{ name: string, value: string }[]>()
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
  const valid = schemaValidate(editConfig.value)
  if (!valid) {
    ajvLocalize[locale.value as Locale](schemaValidate.errors)
    return schemaValidate.errors
  }
  return null
})

const iframeExtraParams = computed(() => {
  return (extraParams.value ?? [])
    .filter(p => p.name && p.value)
    .reduce((a, p) => { a[p.name] = p.value; return a }, { draft: 'true' } as Record<string, string>)
})

const fetchConfig = useFetch('/config')
const editConfig = ref<any>()
watch(fetchConfig.data, (v) => { editConfig.value = v })

const socketDevServer = new ReconnectingWebSocket('ws://localhost:5888')
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
  if (msg.data.type === 'set-config') {
    editConfig.value = setProperty({ ...editConfig.value }, msg.data.content.field, msg.data.content.value)
    await validate()
  }
})

const empty = async () => {
  editConfig.value = null
  await save({})
  editConfig.value = {}
}

const form = useTemplateRef('form')
const validate = async () => {
  await form.value?.validate()
  if (formValid.value) {
    error.value = undefined
    await save(editConfig.value)
  }
}

const save = async (config: any) => {
  await ofetch('/config', { body: config, method: 'put' })
  await reloadIframe()
}

const fetchInfo = useAsyncAction(async () => {
  // read meta from index.html
  const htmlText = await ofetch<string>('/app/index.html')
  const document = parse5.parse(htmlText)
  const html = document.childNodes.filter(isElementNode).find(c => c.tagName === 'html')
  if (!html) throw new Error('broken HTML')
  const defaultLocale = html.attrs?.find(a => a.name === 'lang')?.value || 'fr'
  const head = html.childNodes.filter(isElementNode).find(c => c.tagName === 'head')
  if (!head) throw new Error('broken HTML, missing head tag')

  const parsedMeta: any = {}
  for (const node of head.childNodes.filter(isElementNode).filter(c => c.tagName === 'title')) {
    parsedMeta.title = parsedMeta.title ?? {}
    parsedMeta.title[node?.attrs.find(a => a.name === 'lang')?.value || defaultLocale] = node.childNodes.filter(isTextNode)[0].value
  }

  const metaTags = ['application-name', 'description', 'keywords', 'vocabulary-accept', 'vocabulary-require', 'thumbnail', 'df:overflow', 'df:sync-state', 'df:filter-concepts']
  const localizedMetaTags = ['description', 'keywords']
  const multiValuedMetaTags = ['keywords', 'vocabulary-accept', 'vocabulary-require']

  const metaNodes = head.childNodes
    .filter(isElementNode)
    .filter(c => c.tagName === 'meta')
    .map(c => ({
      name: c.attrs.find(a => a.name === 'name')?.value,
      locale: c.attrs.find(a => a.name === 'lang')?.value || defaultLocale,
      content: c.attrs.find(a => a.name === 'content')?.value
    }))
    .filter(m => m.name && metaTags.includes(m.name))

  for (const metaNode of metaNodes) {
    if (!metaNode.name || !metaNode.content) continue
    if (localizedMetaTags.includes(metaNode.name)) {
      parsedMeta[metaNode.name] = parsedMeta[metaNode.name] || {}
      if (multiValuedMetaTags.includes(metaNode.name)) {
        parsedMeta[metaNode.name][metaNode.locale] = parsedMeta[metaNode.name][metaNode.locale] || []
        if (metaNode.content) parsedMeta[metaNode.name][metaNode.locale].push(metaNode.content)
      } else {
        parsedMeta[metaNode.name][metaNode.locale] = metaNode.content
      }
    } else {
      if (multiValuedMetaTags.includes(metaNode.name)) {
        parsedMeta[metaNode.name] = parsedMeta[metaNode.name] || []
        if (metaNode.content) parsedMeta[metaNode.name].push(metaNode.content)
      } else {
        parsedMeta[metaNode.name] = metaNode.content
      }
    }
  }

  meta.value = parsedMeta

  // fetch config schema
  schema.value = undefined
  const newSchema = await ofetch('/app/config-schema.json')
  newSchema['x-display'] = 'tabs'
  resolveLocaleRefs(newSchema, ajv, locale.value, 'fr')
  schema.value = newSchema
  try {
    schemaValidate = ajv.compile(schema.value)
    compileError.value = undefined
  } catch (err: any) {
    console.error(err)
    compileError.value = err.message
  }
})

const reloadIframe = async () => {
  showPreview.value = false
  await new Promise(resolve => setTimeout(resolve, 1))
  showPreview.value = true
}

</script>

<style lang="css" scoped>
.app-meta p {
  margin-bottom: 4px;
}
</style>
