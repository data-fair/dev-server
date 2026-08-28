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
          <v-list
            height="400"
            max-height="400"
          >
            <v-list-item
              v-for="item in filteredResults"
              :key="item.id"
              :title="item.title"
              :subtitle="`${item.owner?.name ?? ''} · v${item.baseAppVersion}`"
              @click="select(item)"
            />
            <v-list-item v-if="!filteredResults.length">
              <v-list-item-title>{{ t('noResult') }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-alert
            v-if="!info.baseAppFound"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
            :text="info.authenticated ? t('noBaseApp', { appName: info.appName, version: info.minorVersion }) : t('noBaseAppAnonymous', { appName: info.appName, version: info.minorVersion })"
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
  noResult: "No matching configuration"
  noBaseApp: "No base application {appName} in version {version} is declared on this data-fair."
  noBaseAppAnonymous: "No base application {appName} in version {version} is visible without credentials. A base application restricted to an organization only shows up to an authenticated request: set DATAFAIR_API_KEY in the .env of the application."
  attachmentsFailed: "The configuration was copied, but these attachments could not be: {names}. The images referencing them will be broken."
  confirmTitle: "Confirm copy"
  confirmText: "This configuration will replace the current one:"
  cancel: "Cancel"
  copy: "Copy"
  copyAnyway: "Copy anyway"
fr:
  importConfig: "Copier une configuration distante"
  importConfigTitle: "Copier une configuration distante"
  remoteConfigurations: "Configurations de {appName} v{version} sur {remoteUrl}"
  search: "Rechercher"
  noResult: "Aucune configuration correspondante"
  noBaseApp: "Aucune application de base {appName} en version {version} n'est déclarée sur ce data-fair."
  noBaseAppAnonymous: "Aucune application de base {appName} en version {version} n'est visible sans authentification. Une application de base réservée à une organisation n'apparaît qu'à une requête authentifiée : renseigner DATAFAIR_API_KEY dans le .env de l'application."
  attachmentsFailed: "La configuration a été copiée, mais pas ces pièces jointes : {names}. Les images qui les référencent seront cassées."
  confirmTitle: "Confirmer la copie"
  confirmText: "Cette configuration remplacera la configuration actuelle :"
  cancel: "Annuler"
  copy: "Copier"
  copyAnyway: "Copier quand même"
</i18n>

<script lang="ts" setup>
import { ofetch } from 'ofetch'
import { mdiContentCopy, mdiMagnify } from '@mdi/js'

const { t } = useI18n()

const emit = defineEmits<{ copied: [configuration: any] }>()

const menuOpen = ref(false)
const info = ref<{ error?: string, appName?: string, minorVersion?: string, remoteUrl?: string, results?: any[], baseAppFound?: boolean, authenticated?: boolean }>()
const search = ref('')
const selected = ref<any>()
const confirmOpen = ref(false)
const copying = ref(false)
const copyError = ref<string>()
const attachmentsFailed = ref<string[]>([])
// a configuration downloaded but not applied yet, waiting for the developer to acknowledge
// the attachments that could not be copied with it
const pending = ref<any>()

watch(menuOpen, async (open) => {
  if (open) {
    search.value = ''
    info.value = undefined
    try {
      info.value = await ofetch('/configurations')
    } catch (err: any) {
      info.value = { error: err.data?.error ?? err.message }
    }
  }
})

const filteredResults = computed(() => {
  const q = search.value.trim().toLowerCase()
  const results = info.value?.results ?? []
  if (!q) return results
  return results.filter((r: any) => (r.title ?? '').toLowerCase().includes(q) || (r.owner?.name ?? '').toLowerCase().includes(q))
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
