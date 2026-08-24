<template>
  <v-menu
    v-model="menuOpen"
    :close-on-content-click="false"
    max-width="640"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
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
      <v-card-text>
        <v-alert
          v-if="error"
          type="error"
          :text="error"
          class="mb-2"
        />
        <v-alert
          v-else-if="!enriched || !enriched.datasets?.length"
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
          </v-radio-group>

          <v-select
            v-if="kind === 'concept'"
            v-model="conceptId"
            :items="conceptOptions"
            :label="t('conceptField')"
            density="compact"
            hide-details
            class="mb-2"
          />
          <v-select
            v-else
            v-model="fieldKey"
            :items="fieldOptions"
            :label="t('datasetField')"
            density="compact"
            hide-details
            class="mb-2"
          />

          <v-select
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
            hide-details
            class="mb-2"
          />

          <v-row class="align-center mb-2">
            <v-col cols="auto">
              <v-btn
                color="primary"
                :disabled="!filterKey || !value"
                @click="apply"
              >
                {{ t('apply') }}
              </v-btn>
              <v-btn
                variant="text"
                class="ml-2"
                :disabled="!appliedKey"
                @click="remove"
              >
                {{ t('remove') }}
              </v-btn>
            </v-col>
          </v-row>

          <v-alert
            v-if="filterKey"
            type="info"
            density="compact"
            class="mb-1"
          >
            <code>{{ filterKey }}={{ value }}</code>
          </v-alert>
          <p
            v-if="appliedKey"
            class="text-caption mb-0"
          >
            {{ t('applied') }}: <code>{{ appliedKey }}={{ appliedValue }}</code>
          </p>
        </template>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<i18n lang="yaml">
en:
  title: "Test concept / dataset filters"
  intro: "Build a concept (_c_) or dataset (_d_) filter param that is pushed to the preview URL. The app reads it through reactiveSearchParams / useConceptFilters."
  noDataset: "No dataset in the current configuration. Select one in the configuration form first."
  dataset: "Dataset"
  concept: "Concept"
  datasetField: "Dataset field"
  conceptField: "Concept"
  operator: "Operator"
  value: "Value"
  valueHint: "Separate several values with commas for _in / _nin."
  apply: "Apply"
  remove: "Remove filter"
  applied: "Applied in the preview URL"
fr:
  title: "Tester les filtres concepts / dataset"
  intro: "Construisez un filtre par concept (_c_) ou par dataset (_d_) poussé dans l'URL de l'aperçu. L'application le lit via reactiveSearchParams / useConceptFilters."
  noDataset: "Aucun dataset dans la configuration courante. Sélectionnez-en un dans le formulaire de configuration d'abord."
  dataset: "Jeu de données"
  concept: "Concept"
  datasetField: "Champ du dataset"
  conceptField: "Concept"
  operator: "Opérateur"
  value: "Valeur"
  valueHint: "Séparez plusieurs valeurs par des virgules pour _in / _nin."
  apply: "Appliquer"
  remove: "Retirer le filtre"
  applied: "Appliqué dans l'URL de l'aperçu"
</i18n>

<script lang="ts" setup>
import { ofetch } from 'ofetch'
import { mdiFilterVariant } from '@mdi/js'

const { t } = useI18n()

const emit = defineEmits<{ applied: [key: string, value: string] }>()

const menuOpen = ref(false)
const enriched = ref<any>()
const error = ref<string>()

const datasetIndex = ref(0)
const kind = ref<'concept' | 'dataset'>('concept')
const conceptId = ref<string>()
const fieldKey = ref<string>()
const operator = ref('eq')
const value = ref('')

const appliedKey = ref<string>()
const appliedValue = ref<string>()

const operators = [
  { value: 'eq', label: '_eq' },
  { value: 'neq', label: '_neq' },
  { value: 'in', label: '_in' },
  { value: 'nin', label: '_nin' },
  { value: 'gte', label: '_gte' },
  { value: 'lte', label: '_lte' },
  { value: 'starts', label: '_starts' },
  { value: 'exists', label: '_exists' },
  { value: 'nexists', label: '_nexists' },
  { value: 'contains', label: '_contains' },
  { value: 'search', label: '_search' }
]
const operatorOptions = computed(() => operators.map(o => ({ title: o.label, value: o.value })))

const dataset = computed(() => enriched.value?.datasets?.[datasetIndex.value])

const datasetOptions = computed(() => (enriched.value?.datasets ?? []).map((d: any, i: number) => ({ title: d.title || d.id, value: i })))

// fields of the schema, with a readable label (title or key)
const schemaFields = computed(() => (dataset.value?.schema ?? []) as any[])

// concepts: fields that carry an x-concept.primary id
const conceptOptions = computed(() =>
  schemaFields.value
    .filter((f: any) => f['x-concept']?.id)
    .map((f: any) => ({ title: `${f['x-concept'].title || f['x-concept'].id} (${f.key})`, value: f['x-concept'].id }))
)

const fieldOptions = computed(() =>
  schemaFields.value.map((f: any) => ({ title: f.label || f.title || f.key, value: f.key }))
)

// when switching dataset, reset the field/concept selections
watch(datasetIndex, () => {
  conceptId.value = undefined
  fieldKey.value = undefined
})

const filterKey = computed(() => {
  if (!dataset.value) return undefined
  if (kind.value === 'concept') {
    return conceptId.value ? `_c_${conceptId.value}_${operator.value}` : undefined
  }
  return fieldKey.value ? `_d_${dataset.value.id}_${fieldKey.value}_${operator.value}` : undefined
})

watch(menuOpen, async (open) => {
  if (!open) return
  error.value = undefined
  try {
    enriched.value = await ofetch('/config/enriched')
  } catch (err: any) {
    error.value = err.data?.error ?? err.message
  }
})

const apply = () => {
  if (!filterKey.value || !value.value) return
  appliedKey.value = filterKey.value
  appliedValue.value = value.value
  emit('applied', filterKey.value, value.value)
}

const remove = () => {
  if (!appliedKey.value) return
  emit('applied', appliedKey.value, '')
  appliedKey.value = undefined
  appliedValue.value = undefined
}
</script>
