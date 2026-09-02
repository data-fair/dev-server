<template lang="html">
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    max-width="560"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        :title="t('importConfig')"
        :icon="mdiContentCopy"
        class="mx-2"
        size="small"
        color="primary"
        variant="text"
      />
    </template>
    <v-card
      :title="t('importConfigTitle')"
      variant="flat"
    >
      <template #append>
        <v-btn
          :title="t('refresh')"
          :icon="mdiRefresh"
          :loading="loading"
          size="small"
          variant="text"
          density="comfortable"
          @click="load(true)"
        />
      </template>
      <v-card-text>
        <v-alert
          v-if="info?.error"
          type="error"
          :text="info.error"
          class="mb-2"
        />
        <template v-else-if="info">
          <p class="mb-2">
            {{ t('remoteConfigurations', { appName: info.appName, version: info.minorVersion, remoteUrl: info.remoteUrl }) }}
          </p>
          <v-text-field
            v-model="search"
            :label="t('search')"
            :prepend-inner-icon="mdiMagnify"
            density="compact"
            hide-details
            class="mb-2"
          />
          <!-- virtualised: /configurations asks the remote for size=1000, and a data-fair
               that hosts many applications on this minor version used to mount every one of
               them as a v-list-item in the tick that opens the menu -->
          <v-list
            height="400"
            max-height="400"
          >
            <v-virtual-scroll
              v-if="filteredResults.length"
              :items="filteredResults"
              height="400"
              item-height="56"
            >
              <template #default="{ item }">
                <v-list-item
                  :key="item.id"
                  :title="item.title"
                  :subtitle="`${item.owner?.name ?? ''} · v${item.baseAppVersion}`"
                  @click="select(item)"
                />
              </template>
            </v-virtual-scroll>
            <v-list-item v-else>
              <v-list-item-title>{{ t('noResult') }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-alert
            v-if="!info.results?.length"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
            :text="info.authenticated ? t('noConfiguration', { appName: info.appName, version: info.minorVersion }) : t('noConfigurationAnonymous', { appName: info.appName, version: info.minorVersion })"
          />
        </template>
        <div
          v-else
          class="d-flex justify-center pa-4"
        >
          <v-progress-circular indeterminate />
        </div>
      </v-card-text>
    </v-card>
  </v-menu>

  <v-dialog
    v-model="confirmOpen"
    max-width="420"
  >
    <v-card
      :title="t('confirmTitle')"
      variant="flat"
    >
      <v-card-text>
        <p>{{ t('confirmText') }}</p>
        <p class="font-weight-medium mt-2">
          {{ selected?.title }}
        </p>
        <p class="text-caption">
          {{ selected?.owner?.name }} · v{{ selected?.baseAppVersion }}
        </p>
        <!-- the configuration page on the remote data-fair, so that what is about to
             overwrite the local one can be read before confirming -->
        <a
          v-if="configUrl"
          :href="configUrl"
          target="_blank"
          rel="noopener"
          class="text-caption"
        >
          <!-- icon first: after the label it lands alone at the end of the wrapped line -->
          <v-icon
            :icon="mdiOpenInNew"
            size="x-small"
            class="mr-1"
          />{{ t('openRemote') }}
        </a>
        <v-alert
          v-if="copyError"
          type="error"
          :text="copyError"
          class="mt-2"
        />
        <v-alert
          v-if="attachmentsFailed.length"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-2"
          :text="t('attachmentsFailed', { names: attachmentsFailed.join(', ') })"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="confirmOpen = false"
        >
          {{ t('cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          :loading="copying"
          @click="copy"
        >
          {{ pending ? t('copyAnyway') : t('copy') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<i18n lang="yaml">
en:
  importConfig: "Copy a remote configuration"
  importConfigTitle: "Copy a remote configuration"
  remoteConfigurations: "Configurations of {appName} v{version} on {remoteUrl}"
  search: "Search"
  refresh: "Refresh the list from the remote data-fair"
  noResult: "No matching configuration"
  noConfiguration: "No application runs on {appName} in version {version} on this data-fair."
  noConfigurationAnonymous: "No application running on {appName} in version {version} is visible without credentials. Public applications are found without a key; a private one only shows up to an authenticated request: set DATAFAIR_API_KEY in the .env of the application."
  attachmentsFailed: "The configuration was copied, but these attachments could not be: {names}. The images referencing them will be broken."
  confirmTitle: "Confirm copy"
  confirmText: "This configuration will replace the current one:"
  openRemote: "See this configuration on the remote data-fair"
  cancel: "Cancel"
  copy: "Copy"
  copyAnyway: "Copy anyway"
fr:
  importConfig: "Copier une configuration distante"
  importConfigTitle: "Copier une configuration distante"
  remoteConfigurations: "Configurations de {appName} v{version} sur {remoteUrl}"
  search: "Rechercher"
  refresh: "Actualiser la liste depuis le data-fair distant"
  noResult: "Aucune configuration correspondante"
  noConfiguration: "Aucune application ne tourne sur {appName} en version {version} sur ce data-fair."
  noConfigurationAnonymous: "Aucune application tournant sur {appName} en version {version} n'est visible sans authentification. Les applications publiques sont trouvées sans clé ; une application privée n'apparaît qu'à une requête authentifiée : renseigner DATAFAIR_API_KEY dans le .env de l'application."
  attachmentsFailed: "La configuration a été copiée, mais pas ces pièces jointes : {names}. Les images qui les référencent seront cassées."
  confirmTitle: "Confirmer la copie"
  confirmText: "Cette configuration remplacera la configuration actuelle :"
  openRemote: "Voir cette configuration sur le data-fair distant"
  cancel: "Annuler"
  copy: "Copier"
  copyAnyway: "Copier quand même"
</i18n>

<script lang="ts" setup>
import { ofetch } from 'ofetch'
import { mdiContentCopy, mdiMagnify, mdiOpenInNew, mdiRefresh } from '@mdi/js'

const { t } = useI18n()

const emit = defineEmits<{ copied: [configuration: any] }>()

const menuOpen = ref(false)
const info = ref<{ error?: string, appName?: string, minorVersion?: string, remoteUrl?: string, results?: any[], authenticated?: boolean }>()
const search = ref('')
const selected = ref<any>()
const confirmOpen = ref(false)
const copying = ref(false)
const copyError = ref<string>()
const attachmentsFailed = ref<string[]>([])
// a configuration downloaded but not applied yet, waiting for the developer to acknowledge
// the attachments that could not be copied with it
const pending = ref<any>()

const loading = ref(false)

/**
 * Fetching on every open is what made the menu feel slow: `/configurations` is two chained
 * requests to the remote data-fair, and nothing was on screen until both came back. The
 * result is kept between openings instead, and `force` is the refresh button — the remote
 * list does change while the dev server runs, so it must stay refreshable on demand.
 *
 * An error is never what gets kept: it would outlive the incident that produced it and turn
 * one unreachable moment into a menu that never loads again. It is dropped before the retry
 * too, so a failure that is being retried shows the spinner rather than the stale message.
 */
const load = async (force = false) => {
  if (loading.value) return
  if (info.value && !info.value.error && !force) return
  loading.value = true
  info.value = undefined
  try {
    info.value = await ofetch('/configurations')
  } catch (err: any) {
    info.value = { error: err.data?.error ?? err.message }
  } finally {
    loading.value = false
  }
}

watch(menuOpen, (open) => {
  if (open) {
    search.value = ''
    load()
  }
})

const filteredResults = computed(() => {
  const q = search.value.trim().toLowerCase()
  const results = info.value?.results ?? []
  if (!q) return results
  return results.filter((r: any) => (r.title ?? '').toLowerCase().includes(q) || (r.owner?.name ?? '').toLowerCase().includes(q))
})

// data-fair serves the configuration form of an application at /application/<id>/config,
// under the same url the API is read from (config.dataFair.url, echoed back as remoteUrl)
const configUrl = computed(() => {
  if (!info.value?.remoteUrl || !selected.value?.id) return undefined
  return `${info.value.remoteUrl}/application/${encodeURIComponent(selected.value.id)}/config`
})

const select = (item: any) => {
  selected.value = item
  copyError.value = undefined
  attachmentsFailed.value = []
  pending.value = undefined
  confirmOpen.value = true
}

const apply = (configuration: any) => {
  confirmOpen.value = false
  menuOpen.value = false
  emit('copied', configuration)
}

const copy = async () => {
  // second click, after the attachments warning: the configuration is already downloaded and
  // the developer chose to take it with its broken images
  if (pending.value) {
    apply(pending.value)
    return
  }
  copying.value = true
  copyError.value = undefined
  try {
    // the attachments are copied server side, alongside the configuration that references them
    const { configuration, attachments } = await ofetch(`/configurations/${selected.value.id}`)
    if (attachments?.failed?.length) {
      // reported before applying, never after: applying reloads the whole page, and the warning
      // would vanish with it — leaving broken images with nothing pointing back to here
      attachmentsFailed.value = attachments.failed
      pending.value = configuration
      return
    }
    apply(configuration)
  } catch (err: any) {
    copyError.value = err.data?.error ?? err.message
  } finally {
    copying.value = false
  }
}
</script>
