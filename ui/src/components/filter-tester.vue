<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    max-width="640"
  >
    <template #activator="{ props: activatorProps }">
      <v-btn
        v-bind="activatorProps"
        :title="t('title')"
        :icon="mdiFilterVariant"
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
        <!-- while the enriched configuration is on its way `datasets` is empty, and the
             card used to answer "no dataset" — a wrong message, then replaced -->
        <div
          v-if="!enriched && !error"
          class="d-flex justify-center pa-4"
        >
          <v-progress-circular indeterminate />
        </div>
        <v-alert
          v-else-if="error"
          type="error"
          :text="error"
          class="mb-2"
        />
        <v-alert
          v-else-if="!datasets.length"
          type="info"
          :text="t('noDataset')"
          class="mb-2"
        />
        <template v-else>
          <p class="mb-2">
            {{ t('intro') }}
          </p>

          <v-select
            v-model="datasetIndex"
            :items="datasetOptions"
            :label="t('dataset')"
            density="compact"
            hide-details
            class="mb-2"
          />

          <v-radio-group
            v-model="kind"
            inline
            density="compact"
            hide-details
            class="mb-1"
          >
            <v-radio
              :label="t('concept')"
              value="concept"
            />
            <v-radio
              :label="t('datasetField')"
              value="dataset"
            />
            <v-radio
              :label="t('universal')"
              value="universal"
            />
          </v-radio-group>

          <v-alert
            v-if="kind === 'concept' && !conceptOptions.length"
            type="warning"
            density="compact"
            class="mb-2"
            :text="t('noConcept')"
          />
          <v-select
            v-else-if="kind === 'concept'"
            v-model="conceptId"
            :items="conceptOptions"
            :label="t('conceptField')"
            :hint="t('conceptHint')"
            persistent-hint
            density="compact"
            class="mb-2"
          />
          <v-select
            v-else-if="kind === 'dataset'"
            v-model="fieldKey"
            :items="fieldOptions"
            :label="t('datasetField')"
            :hint="t('datasetFieldHint')"
            persistent-hint
            density="compact"
            class="mb-2"
          />
          <v-select
            v-else
            v-model="universalKey"
            :items="universalOptions"
            :label="t('universal')"
            :hint="universalHint"
            persistent-hint
            density="compact"
            class="mb-2"
          />

          <v-select
            v-if="kind !== 'universal'"
            v-model="operator"
            :items="operatorOptions"
            :label="t('operator')"
            density="compact"
            hide-details
            class="mb-2"
          />

          <v-text-field
            v-model="value"
            :label="t('value')"
            :hint="t('valueHint')"
            persistent-hint
            density="compact"
            class="mb-2"
            @keyup.enter="apply"
          />

          <v-btn
            color="primary"
            :disabled="!filterKey || !value"
            @click="apply"
          >
            {{ t('apply') }}
          </v-btn>
          <code
            v-if="filterKey"
            class="ml-2"
          >{{ filterKey }}={{ value }}</code>

          <template v-if="applied.length">
            <h4 class="text-subtitle-2 font-weight-bold mt-4">
              {{ t('applied') }}
            </h4>
            <v-chip
              v-for="param in applied"
              :key="param.name"
              class="mr-1 mt-1"
              size="small"
              closable
              @click:close="emit('applied', param.name, '')"
            >
              {{ param.name }}={{ param.value }}
            </v-chip>
          </template>
        </template>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<i18n lang="yaml">
en:
  title: "Test concept / dataset filters"
  refresh: "Refresh the configuration"
  intro: "Build a filter param following the URL convention and push it to the preview URL. The app reads it through reactiveSearchParams / useConceptFilters."
  noDataset: "No dataset in the current configuration. Select one in the configuration form first."
  noConcept: "No field of this dataset carries a primary concept. Only x-concept.primary fields can be targeted by a _c_ filter; use a dataset field filter instead."
  dataset: "Dataset"
  concept: "Concept"
  datasetField: "Dataset field"
  conceptField: "Concept"
  conceptHint: "_c_<concept>_<op>: dataset-agnostic, silently ignored if the target has no such concept."
  datasetFieldHint: "_d_<datasetId>_<field>_<op>: scoped to this dataset, HTTP 400 if the field does not exist."
  universal: "Universal"
  operator: "Operator"
  value: "Value"
  valueHint: "Comma separated values for _in / _nin, two keys (_gte + _lte) for a range."
  apply: "Apply"
  applied: "Applied in the preview URL"
  hint_c_q: "Fulltext search."
  hint_c_date_match: "YYYY-MM-DD, or a range YYYY-MM-DD,YYYY-MM-DD."
  hint_c_geo_distance: "lon,lat,radiusInMeters — e.g. 2.3522,48.8566,5000"
  hint_c_bbox: "left,bottom,right,top"
  hint_id_eq: "Filter on the id of a single line."
fr:
  title: "Tester les filtres concepts / dataset"
  refresh: "Actualiser la configuration"
  intro: "Construisez un filtre suivant la convention d'URL et poussez-le dans l'URL de l'aperçu. L'application le lit via reactiveSearchParams / useConceptFilters."
  noDataset: "Aucun dataset dans la configuration courante. Sélectionnez-en un dans le formulaire de configuration d'abord."
  noConcept: "Aucun champ de ce jeu de données ne porte de concept primaire. Seuls les champs x-concept.primary sont ciblables par un filtre _c_ ; utilisez plutôt un filtre par champ."
  dataset: "Jeu de données"
  concept: "Concept"
  datasetField: "Champ du dataset"
  conceptField: "Concept"
  conceptHint: "_c_<concept>_<op> : indépendant du jeu de données, ignoré silencieusement si la cible ne porte pas ce concept."
  datasetFieldHint: "_d_<datasetId>_<champ>_<op> : scopé à ce jeu de données, erreur 400 si le champ n'existe pas."
  universal: "Universel"
  operator: "Opérateur"
  value: "Valeur"
  valueHint: "Valeurs séparées par des virgules pour _in / _nin, deux clés (_gte + _lte) pour une plage."
  apply: "Appliquer"
  applied: "Appliqués dans l'URL de l'aperçu"
  hint_c_q: "Recherche fulltext."
  hint_c_date_match: "YYYY-MM-DD, ou une plage YYYY-MM-DD,YYYY-MM-DD."
  hint_c_geo_distance: "lon,lat,rayonEnMètres — ex. 2.3522,48.8566,5000"
  hint_c_bbox: "gauche,bas,droite,haut"
  hint_id_eq: "Filtre sur l'id d'une ligne."
</i18n>

<script lang="ts" setup>
import { ofetch } from 'ofetch'
import { mdiFilterVariant, mdiRefresh } from '@mdi/js'

const { t } = useI18n()

const props = defineProps<{
  // the params currently on the preview URL, owned by App.vue
  extraParams?: { name: string, value: string }[]
}>()

const emit = defineEmits<{ applied: [key: string, value: string] }>()

const menuOpen = ref(false)
const enriched = ref<any>()
const error = ref<string>()

const datasetIndex = ref(0)
const kind = ref<'concept' | 'dataset' | 'universal'>('concept')
const conceptId = ref<string>()
const fieldKey = ref<string>()
const universalKey = ref('_c_q')
const operator = ref('eq')
const value = ref('')

// FILTER_CAPABILITIES, cf. references/filters-url-convention.md
const operatorOptions = ['eq', 'neq', 'in', 'nin', 'lt', 'lte', 'gt', 'gte', 'starts', 'exists', 'nexists', 'contains', 'search']
  .map(op => ({ title: '_' + op, value: op }))

// concepts that apply to any dataset, without targeting a column
const universalOptions = ['_c_q', '_c_date_match', '_c_geo_distance', '_c_bbox', '_id_eq']
  .map(key => ({ title: key, value: key }))
const universalHint = computed(() => t('hint' + universalKey.value))

const datasets = computed<any[]>(() => enriched.value?.datasets?.filter((d: any) => d?.id) ?? [])
const dataset = computed(() => datasets.value[datasetIndex.value])
const datasetOptions = computed(() => datasets.value.map((d, i) => ({ title: d.title || d.id, value: i })))

const schemaFields = computed(() => (dataset.value?.schema ?? []) as any[])

// only x-concept.primary fields are resolved by the REST API against a _c_ filter
const conceptOptions = computed(() =>
  schemaFields.value
    .filter((f: any) => f['x-concept']?.id && f['x-concept'].primary)
    .map((f: any) => ({ title: `${f['x-concept'].title || f['x-concept'].id} (${f.key})`, value: f['x-concept'].id }))
)

const fieldOptions = computed(() =>
  schemaFields.value.map((f: any) => ({ title: `${f.title || f['x-originalName'] || f.key} (${f.key})`, value: f.key }))
)

// when switching dataset, reset the field/concept selections
watch(datasetIndex, () => {
  conceptId.value = undefined
  fieldKey.value = undefined
})

const filterKey = computed(() => {
  if (kind.value === 'universal') return universalKey.value
  if (!dataset.value) return undefined
  if (kind.value === 'concept') {
    return conceptId.value ? `_c_${conceptId.value}_${operator.value}` : undefined
  }
  return fieldKey.value ? `_d_${dataset.value.id}_${fieldKey.value}_${operator.value}` : undefined
})

// filters currently on the preview URL, single source of truth in App.vue
const applied = computed(() => (props.extraParams ?? []).filter(p => p.name.startsWith('_c') || p.name.startsWith('_d_') || p.name.startsWith('_id_')))

const loading = ref(false)

/**
 * Refetched on every opening, with the previous answer left on screen meanwhile: the
 * enriched configuration is a remote call, and the menu had nothing to show until it came
 * back. Unlike the remote application list, this one changes under the developer's hands —
 * a cached copy would go stale in seconds — so it is refreshed rather than kept, and
 * `force` (the refresh button) also drops what is displayed so a failed refresh cannot pass
 * for fresh data.
 */
const load = async (force = false) => {
  if (loading.value) return
  loading.value = true
  error.value = undefined
  if (force) enriched.value = undefined
  try {
    enriched.value = await ofetch('/config/enriched')
  } catch (err: any) {
    error.value = err.data?.error ?? err.message
  } finally {
    loading.value = false
  }
}

watch(menuOpen, (open) => {
  if (open) load()
})

const apply = () => {
  if (!filterKey.value || !value.value) return
  emit('applied', filterKey.value, value.value)
}
</script>
