<template>
  <v-app>
    <v-main>
      <v-container data-iframe-height>
        <h1 class="text-headline-small mt-0 mb-2">
          {{ t('hello') }}
        </h1>
        <p class="mb-4">
          {{ t('intro') }}
        </p>

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

        <!-- an animated gauge, only to exercise the gif path of the capture service -->
        <v-card class="mb-4">
          <v-card-title>{{ t('animation') }}</v-card-title>
          <v-card-text>
            <v-progress-linear
              :model-value="animationProgress"
              height="12"
              rounded
              color="primary"
            />
            <div class="text-caption mt-1">
              {{ t('frame') }} {{ capture.frame.value }} / {{ capture.animationFrames }}
            </div>
          </v-card-text>
        </v-card>

        <!-- controls carry no information in a still image: hidden under capture -->
        <v-card
          v-if="!capture.inCapture"
          class="mb-4"
        >
          <v-card-title>{{ t('searchParams') }}</v-card-title>
          <v-card-text>
            <div class="mb-2">
              {{ reactiveSearchParams }}
            </div>
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

        <!-- keyed on the id: useConceptFilters closes over it, and df:sync-config lets the
             configuration change without a reload -->
        <dataset-filters
          v-if="dataset"
          :key="dataset.id"
          :dataset="dataset"
          @settled="capture.trigger()"
        />
        <v-alert
          v-else
          type="info"
          class="mb-4"
          density="compact"
          :text="t('noDataset')"
        />

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
  intro: "This app demonstrates theme, language, reactive search params, concept filters, resizing and the capture contract."
  currentLanguage: "Current language"
  localizedDate: "Localized date"
  currentTheme: "Current theme"
  rowLabel: "Row"
  searchParams: "Reactive search params"
  setParam: "Set query param"
  deleteParam: "Delete query param"
  sendError: "Send error to parent"
  animation: "Animation (gif capture)"
  frame: "Frame"
  noDataset: "No dataset configured. Select one in the configuration form to test concept and dataset filters."
fr:
  hello: "Bonjour depuis la test-app moderne"
  intro: "Cette application démontre le thème, la langue, les reactive search params, les filtres par concepts, le redimensionnement et le contrat de capture."
  currentLanguage: "Langue courante"
  localizedDate: "Date localisée"
  currentTheme: "Thème courant"
  rowLabel: "Ligne"
  searchParams: "Reactive search params"
  setParam: "Définir un paramètre"
  deleteParam: "Supprimer le paramètre"
  sendError: "Envoyer une erreur"
  animation: "Animation (capture gif)"
  frame: "Image"
  noDataset: "Aucun jeu de données configuré. Sélectionnez-en un dans le formulaire de configuration pour tester les filtres par concepts et par champs."
</i18n>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from 'vuetify'
import { ofetch } from 'ofetch'
import { useLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConfig, useApplication } from './composables/config'
import { useCapture } from './composables/capture'
import datasetFilters from './components/dataset-filters.vue'

const { t, locale } = useI18n()
const theme = useTheme()
const { dayjs } = useLocaleDayjs()
const { config } = useConfig()
const app = useApplication()
const capture = useCapture()

const themeName = computed(() => theme.global.name.value)
const formattedDate = computed(() => dayjs().format('LLLL'))

const rows = computed(() => config.value?.rows ?? 5)

// window.APPLICATION.configuration.datasets is an array, and data-fair has already injected
// the full schema with its concepts: no need to fetch the dataset metadata
const dataset = computed(() => config.value?.datasets?.[0])

const animationProgress = computed(() => (capture.frame.value / capture.animationFrames) * 100)

// no dataset to wait for: this is a terminal path too, the capture must not wait for it
watch(dataset, (value) => { if (!value) capture.trigger() }, { immediate: true })

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
