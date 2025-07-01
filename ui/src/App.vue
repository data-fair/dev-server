<template lang="html">
  <v-container
    fluid
    class="pt-4"
  >
    <v-row>
      <v-col
        xs="12"
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
            fab
            dark
            small
            color="primary"
            :loading="loading"
            @click="fetchInfo"
          >
            <v-icon dark>
              mdi-refresh
            </v-icon>
          </v-btn>
        </v-row>
        <h2 class="text-h6 mt-2">
          {{ $t('config') }}
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
            :options="options"
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
              {{ $t('metadata') }}
            </h2>

            <p v-if="meta['application-name']">
              <b>application-name:</b> {{ meta['application-name'] }}
            </p>
            <v-alert
              v-else
              type="error"
              dense
            >
              {{ $t('missingApplicationName') }}
            </v-alert>

            <p v-if="meta.thumbnail">
              <b>thumbnail:</b> <img
                width="25"
                :src="meta.thumbnail.startsWith('http://') || meta.thumbnail.startsWith('https://') ? meta.thumbnail : 'http://localhost:5888/app/' + meta.thumbnail"
              >
            </p>
            <v-alert
              v-else
              type="error"
              dense
            >
              {{ $t('missingThumbnail') }}
            </v-alert>

            <p v-if="meta.title && meta.title[$i18n.locale]">
              <b>title:</b> {{ meta.title[$i18n.locale] }}
            </p>
            <v-alert
              v-else
              type="error"
              dense
            >
              {{ $t('missingTitle', {locale: $i18n.locale}) }}
            </v-alert>

            <p v-if="meta.description && meta.description[$i18n.locale]">
              <b>description:</b> {{ meta.description[$i18n.locale] }}
            </p>
            <v-alert
              v-else
              type="error"
              dense
            >
              {{ $t('missingDesc', {locale: $i18n.locale}) }}
            </v-alert>

            <p v-if="meta.keywords && meta.keywords[$i18n.locale]">
              <b>keywords:</b> {{ meta.keywords[$i18n.locale] }}
            </p>
            <v-alert
              v-else
              type="error"
              dense
            >
              {{ $t('missingKeywords', {locale: $i18n.locale}) }}
            </v-alert>

            <p v-if="meta['vocabulary-accept']">
              <b>vocabulary-accept:</b> {{ meta['vocabulary-accept'] }}
            </p>
            <v-alert
              v-else
              type="info"
              dense
            >
              {{ $t('missingVocabAccept', {locale: $i18n.locale}) }}
            </v-alert>

            <p v-if="meta['vocabulary-require']">
              <b>vocabulary-require:</b> {{ meta['vocabulary-require'] }}
            </p>
            <v-alert
              v-else
              type="info"
              dense
            >
              {{ $t('missingVocabRequire', {locale: $i18n.locale}) }}
            </v-alert>
            <p v-if="meta['df:overflow']">
              <b>df:overflow:</b> {{ meta['df:overflow'] }}
            </p>
            <v-alert
              v-else
              type="info"
              dense
            >
              {{ $t('missingDFOverflow', {locale: $i18n.locale}) }}
            </v-alert>

            <p v-if="meta['df:sync-state']">
              <b>df:sync-state:</b> {{ meta['df:sync-state'] }}
            </p>
            <v-alert
              v-else
              type="info"
              dense
            >
              {{ $t('missingDFSyncState', {locale: $i18n.locale}) }}
            </v-alert>

            <p v-if="meta['df:filter-concepts']">
              <b>df:filter-concepts:</b> {{ meta['df:filter-concepts'] }}
            </p>
            <v-alert
              v-else
              type="info"
              dense
            >
              {{ $t('missingDFFilterConcepts', {locale: $i18n.locale}) }}
            </v-alert>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        xs="12"
        md="6"
        lg="8"
      >
        <v-row class="mb-2">
          <v-spacer />
          <screenshot-simulation />
          <v-btn
            class="mx-2"
            fab
            dark
            small
            color="primary"
            title="reload iframe content"
            @click="reloadIframe"
          >
            <v-icon dark>
              mdi-refresh
            </v-icon>
          </v-btn>
          <v-btn
            class="mx-2"
            fab
            dark
            small
            color="primary"
            href="http://localhost:5888/app"
            title="open in full page"
            target="blank"
          >
            <v-icon dark>
              mdi-open-in-new
            </v-icon>
          </v-btn>
          <lang-switcher />
        </v-row>
        <v-card>
          <v-iframe
            v-if="showPreview && meta"
            src="http://localhost:5888/app"
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

<script lang="ts" type="setup">

import {ref, computed, watch} from 'vue'
import reconnectingWebSocketModule from 'reconnecting-websocket'
import jsonRefs from '@koumoul/vjsf/lib/utils/json-refs.js'
import {setProperty} from 'dot-prop'

// import ScreenshotSimulation from '~/components/screenshot-simulation.vue'
import * as parse5 from 'parse5'
import Ajv from 'ajv'
import ajvFormats from 'ajv-formats'
import ajvLocalize from 'ajv-i18n'
import { $uiConfig } from './context'
import { useI18n } from 'vue-i18n'
import {fetch} from 'ofetch'
import {useFetch} from '@data-fair/lib-vue/fetch.js'
import {useAsyncAction} from '@data-fair/lib-vue/async-action.js'
import '@data-fair/frame/lib/d-frame.js'
import Vjsf, { type Options as VjsfOptions } from '@koumoul/vjsf'
import { v2compat } from '@koumoul/vjsf/compat/v2'

const ReconnectingWebSocket = reconnectingWebSocketModule as unknown as typeof reconnectingWebSocketModule.default

const ajv = new Ajv({ strict: false, allErrors: true, messages: false })
ajv.addFormat('hexcolor', /^#[0-9A-Fa-f]{6,8}$/)
ajvFormats(ajv)

type Meta = Record<string, string>

const {t} = useI18n()

const error = ref<string>()
const schema = ref<any>()
const editConfig = ref<any>()
const showPreview = ref(true)
const compileError = ref<string>()
const formValid = ref(false)
const iframeLog = ref(false)
const loading = ref(false)
const meta = ref<Meta>()
const extraParams = ref<{name: string, value: string}[]>()

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
          ] },
    updateOn: 'blur',
    initialValidation: 'always',
  }
})

const validationErrors = computed(() => {
  if (!schema.value || !schemaValidate) return
      const valid = this.schemaValidate(this.editConfig)
      if (!valid) {
        ajvLocalize[this.$i18n.locale as 'en' | 'fr'](this.schemaValidate.errors)
        return this.schemaValidate.errors
      }
      return null
})

const iframeExtraParams = computed(() => {
  return extraParams.value
    .filter(p => p.name && p.value)
    .reduce((a, p) => { a[p.name] = p.value; return a }, { draft: 'true' } as Record<string, string>)
})

const fetchConfig = useFetch('http://localhost:5888/config')
const editConfig = ref<any>()
watch(fetchConfig.data, (v) => editConfig.value = v)

const socketDevServer = new ReconnectingWebSocket('ws://localhost:5888')
socketDevServer.onopen = () => {
  socketDevServer.onmessage = (event) => {
    const data = JSON.parse(event.data)
    if (data.type === 'app-error') {
      this.error = data.data.message
    }
  }
}

    window.addEventListener('message', async msg => {
      console.log('received message from iframe', msg.data)
      if (msg.data.type === 'set-config') {
        this.loading = true
        this.editConfig = setProperty({ ...this.editConfig }, msg.data.content.field, msg.data.content.value)
        await this.validate()
        this.loading = false
      }
    })


const empty = async () => {
  editConfig.value = null
  await save({})
  editConfig.value = {}
}

const form = useTemplateRef('form')
const valid = ref(false)
const validate = async async () => {
  await form.value?.validate()
  if (valid.value) {
    error.value = undefined
    await save(editConfig.value)
  }
}

const save = async (config: any) => {
  await fetch('http://localhost:5888/config', {body: config, method: 'put'})
  await reloadIframe()
}

const fetchInfo = useAsyncAction(async () => {

      // read meta from index.html
      const htmlText = await fetch('http://localhost:5888/app/index.html')
      const document = parse5.parse(htmlText)
      const html = document.childNodes.find(c => c.tagName === 'html')
      if (!html) throw new Error('broken HTML')
      const defaultLocale = html.attrs?.find(a => a.name === 'lang')?.value || this.$i18n.defaultLocale
      const head = html.childNodes.find(c => c.tagName === 'head')
      if (!head) throw new Error('broken HTML, missing head tag')

      const meta = { title: {} }
      for (const node of head.childNodes.filter(c => c.tagName === 'title')) {
        meta.title[node?.attrs.find(a => a.name === 'lang')?.value || defaultLocale] = node.childNodes?.[0].value
      }

      const metaTags = ['application-name', 'description', 'keywords', 'vocabulary-accept', 'vocabulary-require', 'thumbnail', 'df:overflow', 'df:sync-state', 'df:filter-concepts']
      const localizedMetaTags = ['description', 'keywords']
      const multiValuedMetaTags = ['keywords', 'vocabulary-accept', 'vocabulary-require']

      const metaNodes = head.childNodes
        .filter(c => c.tagName === 'meta')
        .map(c => ({
          name: c.attrs.find(a => a.name === 'name')?.value,
          locale: c.attrs.find(a => a.name === 'lang')?.value || defaultLocale,
          content: c.attrs.find(a => a.name === 'content')?.value
        }))
        .filter(m => metaTags.includes(m.name))

      for (const metaNode of metaNodes) {
        if (localizedMetaTags.includes(metaNode.name)) {
          meta[metaNode.name] = meta[metaNode.name] || {}
          if (multiValuedMetaTags.includes(metaNode.name)) {
            meta[metaNode.name][metaNode.locale] = meta[metaNode.name][metaNode.locale] || []
            if (metaNode.content) meta[metaNode.name][metaNode.locale].push(metaNode.content)
          } else {
            meta[metaNode.name][metaNode.locale] = metaNode.content
          }
        } else {
          if (multiValuedMetaTags.includes(metaNode.name)) {
            meta[metaNode.name] = meta[metaNode.name] || []
            if (metaNode.content) meta[metaNode.name].push(metaNode.content)
          } else {
            meta[metaNode.name] = metaNode.content
          }
        }
      }

      this.meta = meta

      // fetch config schema
      this.schema = null
      const schema = await fetch('http://localhost:5888/app/config-schema.json')
      schema['x-display'] = 'tabs'

      this.schema = jsonRefs.resolve(schema, { '~$locale~': this.$i18n.locale === this.$i18n.defaultLocale ? this.$i18n.locale : [this.$i18n.locale, this.$i18n.defaultLocale] })
      try {
        this.schemaValidate = ajv.compile(this.schema)
        this.compileError = null
      } catch (err) {
        console.error(err)
        this.compileError = err.message
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
