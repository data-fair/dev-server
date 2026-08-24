<template>
  <v-app>
    <v-main>
      <v-container data-iframe-height>
        <h1 class="text-headline-small mt-0 mb-2">{{ t('hello') }}</h1>
        <p class="mb-4">{{ t('intro') }}</p>

        <v-card
          color="primary"
          class="mb-4"
        >
          <v-card-text>
            <div>{{ t('currentLanguage') }}: <strong>{{ locale }}</strong></div>
            <div>{{ t('localizedDate') }}: <strong>{{ formattedDate }}</strong></div>
            <div>{{ t('currentTheme') }}: <strong>{{ themeName }}</strong></div>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>{{ t('searchParams') }}</v-card-title>
          <v-card-text>
            <div class="mb-2">{{ reactiveSearchParams }}</div>
            <v-btn
              class="mr-2"
              color="primary"
              size="small"
              @click="setParam"
            >
              {{ t('setParam') }}
            </v-btn>
            <v-btn
              class="mr-2"
              color="warning"
              size="small"
              @click="deleteParam"
            >
              {{ t('deleteParam') }}
            </v-btn>
            <v-btn
              color="error"
              size="small"
              @click="sendError"
            >
              {{ t('sendError') }}
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="mb-4">
          <v-card-title>{{ t('conceptFilters') }}</v-card-title>
          <v-card-text>
            <div class="mb-1">{{ t('conceptFiltersIntro') }}</div>
            <div class="mb-2"><code>{{ conceptFilters }}</code></div>
            <template v-if="datasetUrl">
              <div class="mb-1">
                {{ t('matchingLines') }}: <strong>{{ linesTotal }}</strong>
                <v-progress-circular
                  v-if="loading"
                  size="16"
                  indeterminate
                  class="ml-2"
                />
              </div>
              <v-alert
                v-if="linesError"
                type="error"
                :text="linesErrorMsg"
                density="compact"
              />
            </template>
            <v-alert
              v-else
              type="info"
              :text="t('noDatasetForFilters')"
              density="compact"
            />
          </v-card-text>
        </v-card>

        <v-list class="border-lg rounded-lg py-0">
          <v-list-item
            v-for="n in rows"
            :key="n"
            :title="`${t('rowLabel')} ${n}`"
            class="border-b"
          />
        </v-list>

      </v-container>
    </v-main>
  </v-app>
</template>

<i18n lang="yaml">
en:
  hello: "Hello from the modern test app"
  intro: "This app demonstrates theme, language, reactive search params and resize."
  currentLanguage: "Current language"
  localizedDate: "Localized date"
  currentTheme: "Current theme"
  rowLabel: "Row"
  searchParams: "Reactive search params"
  setParam: "set query param"
  deleteParam: "delete query param"
  sendError: "send error to parent"
  conceptFilters: "Concept / dataset filters"
  conceptFiltersIntro: "These _c_ / _d_ params are read from the URL by useConceptFilters and applied to the dataset API call below."
  matchingLines: "Matching lines"
  noDatasetForFilters: "Select a dataset in the configuration to test concept/dataset filters."
fr:
  hello: "Bonjour depuis la test-app moderne"
  intro: "Cette application démontre le thème, la langue, les reactive search params et le redimensionnement."
  currentLanguage: "Langue courante"
  localizedDate: "Date localisée"
  currentTheme: "Thème courant"
  rowLabel: "Ligne"
  searchParams: "Reactive search params"
  setParam: "définir un paramètre"
  deleteParam: "supprimer le paramètre"
  sendError: "envoyer une erreur"
  conceptFilters: "Filtres concepts / dataset"
  conceptFiltersIntro: "Ces paramètres _c_ / _d_ sont lus depuis l'URL par useConceptFilters et appliqués à l'appel API du dataset ci-dessous."
  matchingLines: "Lignes correspondantes"
  noDatasetForFilters: "Sélectionnez un dataset dans la configuration pour tester les filtres concepts / dataset."
</i18n>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { ofetch } from 'ofetch'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import { useReactiveSearchParams } from '@data-fair/lib-vue/reactive-search-params.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { getErrorMsg } from '@data-fair/lib-vue/ui-notif.js'
import { useConfig, useApplication } from './composables/config'

const { t, locale } = useI18n()
const theme = useTheme()
const { dayjs } = useLocaleDayjs()
const { config } = useConfig()
const app = useApplication()

const reactiveSearchParams = useReactiveSearchParams()

const themeName = computed(() => theme.global.name.value)
const formattedDate = computed(() => dayjs().format('LLLL'))

const rows = computed(() => config.value?.rows ?? 5)

const dataset = computed(() => config.value?.dataset)
const datasetUrl = computed(() => dataset.value?.href)
// read concept (_c_*) and dataset-scoped (_d_<id>_*) filters from the URL, following
// the filters-url-convention (see the skill-apps reference)
const conceptFilters = useConceptFilters(reactiveSearchParams, dataset.value?.id)

// fetch lines with the concept/dataset filters applied, to prove the filters reach the API
const { data: linesData, loading, error: linesError } = useFetch<{ total: number }>(
  () => datasetUrl.value ? datasetUrl.value + '/lines' : null,
  {
    query: computed(() => ({ size: 0, ...conceptFilters }))
  }
)
const linesTotal = computed(() => linesData.value?.total ?? 0)
const linesErrorMsg = computed(() => linesError.value ? getErrorMsg(linesError.value) : '')

function setParam () {
  reactiveSearchParams.param = 'test'
}

function deleteParam () {
  delete reactiveSearchParams.param
}

function sendError () {
  ofetch(app.href + '/error', { body: { message: 'test error' }, method: 'POST' })
}
</script>
