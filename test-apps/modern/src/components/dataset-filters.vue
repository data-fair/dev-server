<template>
  <v-card class="mb-4">
    <v-card-title>{{ t('title') }}</v-card-title>
    <v-card-text>
      <div class="mb-1">
        {{ t('intro') }}
      </div>
      <div class="mb-2">
        <code>{{ Object.keys(conceptFilters).length ? conceptFilters : t('noFilter') }}</code>
      </div>
      <div>
        {{ t('matchingLines') }}: <strong>{{ total }}</strong>
        <span class="text-caption ml-2">/ {{ t('withoutFilters') }} {{ unfilteredTotal }}</span>
        <v-progress-circular
          v-if="loading"
          size="16"
          indeterminate
          class="ml-2"
        />
      </div>
      <v-alert
        v-if="error"
        type="error"
        class="mt-2"
        density="compact"
        :text="getErrorMsg(error)"
      />
    </v-card-text>
  </v-card>
</template>

<i18n lang="yaml">
en:
  title: "Concept / dataset filters"
  intro: "These _c_ / _d_ params are read from the URL by useConceptFilters and applied to the dataset API call below."
  noFilter: "no filter in the URL"
  matchingLines: "Matching lines"
  withoutFilters: "without filters:"
fr:
  title: "Filtres concepts / jeu de données"
  intro: "Ces paramètres _c_ / _d_ sont lus depuis l'URL par useConceptFilters et appliqués à l'appel API du jeu de données ci-dessous."
  noFilter: "aucun filtre dans l'URL"
  matchingLines: "Lignes correspondantes"
  withoutFilters: "sans filtres :"
</i18n>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { getErrorMsg } from '@data-fair/lib-vue/ui-notif.js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import type { Dataset } from '../config'

const props = defineProps<{ dataset: Dataset }>()

// settled once the dataset call has an answer, whichever it is: the capture must not wait
// for a success path that may never come
const emit = defineEmits<{ settled: [] }>()

const { t } = useI18n()

// useConceptFilters closes over the dataset id, so this component is keyed on it by the
// parent: switching dataset recreates it instead of keeping stale _d_<id>_ filters
const conceptFilters = useConceptFilters(reactiveSearchParams, props.dataset.id)

const linesUrl = computed(() => props.dataset.href ? props.dataset.href + '/lines' : null)

const { data, loading, error, initialized } = useFetch<{ total: number }>(linesUrl, {
  query: computed(() => ({ size: 0, ...conceptFilters }))
})
// reference point, so that a filter that matches nothing is not confused with an empty dataset
const { data: unfiltered } = useFetch<{ total: number }>(linesUrl, { query: { size: 0 }, notifError: false })

const total = computed(() => data.value?.total ?? 0)
const unfilteredTotal = computed(() => unfiltered.value?.total ?? 0)

watch([initialized, loading], () => {
  if (initialized.value && !loading.value) emit('settled')
}, { immediate: true })
</script>
