<template>
  <p
    v-if="present"
    class="mb-2"
  >
    <b>{{ label }}:</b> <slot />
  </p>
  <v-alert
    v-else
    :type="severity"
    :title="t('metaMissingTitle', { name: label })"
    :text="t(missingKey)"
    density="compact"
    class="mb-2"
  />
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  present: boolean
  severity: 'error' | 'info'
  missingKey: string
}>()

const { t } = useI18n()
</script>

<i18n lang="yaml">
en:
  metaMissingTitle: 'Metadata "{name}" is missing.'
  missingApplicationName: 'Add a tag <meta name="application-name" content="my-application">'
  missingTitle: 'Add a single tag <title>My title</title>, without a lang attribute'
  missingDesc: 'Add a single tag <meta name="description" content="My description">, without a lang attribute'
  missingDFOverflow: 'Set it to "true" to signify that the application might overflow its initial boundaries and require either resizing of these boundaries or scroll bars.'
  missingDFSyncState: 'Set it to "true" to signify that the application can have some state synchronized in its url (path and query params) that might be used by portals to create more useful links and screenshots.'
  missingDFFilterConcepts: 'Set it to "true" to signify that the application supports filtering its datasets based on concepts values.'
  missingDFVsf: 'Set it to "3" to use the modern v3 application configuration edition. You will need to upgrade the schema with the newest annotations (layout instead of x-display, etc).'
  missingDFSyncConfig: 'Set it to "true" if your application supports dynamic configuration reloading through postMessage.'
fr:
  metaMissingTitle: 'La métadonnée "{name}" est manquante.'
  missingApplicationName: 'Ajoutez une balise <meta name="application-name" content="my-application">'
  missingTitle: 'Ajoutez une unique balise <title>Mon titre</title>, sans attribut lang'
  missingDesc: 'Ajoutez une unique balise <meta name="description" content="Ma description">, sans attribut lang'
  missingDFOverflow: 'Définissez-la à "true" pour indiquer que l''application peut déborder de ses limites initiales et nécessiter un redimensionnement ou des barres de défilement.'
  missingDFSyncState: 'Définissez-la à "true" pour indiquer que l''application peut synchroniser un état dans son URL (chemin et paramètres) que les portails peuvent utiliser pour créer des liens et captures plus utiles.'
  missingDFFilterConcepts: 'Définissez-la à "true" pour indiquer que l''application sait filtrer ses jeux de données selon les valeurs de concepts.'
  missingDFVsf: 'Définissez-la à "3" pour utiliser l''édition de configuration moderne v3. Vous devrez mettre à jour le schéma avec les nouvelles annotations (layout au lieu de x-display, etc).'
  missingDFSyncConfig: 'Définissez-la à "true" si votre application gère le rechargement dynamique de configuration via postMessage.'
</i18n>
