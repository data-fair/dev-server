<template>
  <!-- mode="forbidden": the metadata must not be declared anymore, only its presence is an event -->
  <v-alert
    v-if="mode === 'forbidden' && present"
    :type="severity"
    :title="t('metaForbiddenTitle', { name: label })"
    :text="t(messageKey)"
    density="compact"
    class="mb-2"
  />

  <!-- a declared metadata: show its value -->
  <p
    v-else-if="present"
    class="mb-2"
  >
    <b>{{ label }}:</b> <slot />
  </p>

  <!-- mode="missing": the metadata is expected, warn about its absence. mode="optional" stays silent. -->
  <v-alert
    v-else-if="mode === 'missing'"
    :type="severity"
    :title="t('metaMissingTitle', { name: label })"
    :text="t(messageKey)"
    density="compact"
    class="mb-2"
  />
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
  label: string
  present: boolean
  severity: 'error' | 'info' | 'warning'
  messageKey: string
  mode?: 'missing' | 'optional' | 'forbidden'
}>(), { mode: 'missing' })

const { t } = useI18n()
</script>

<i18n lang="yaml">
en:
  metaMissingTitle: 'Metadata "{name}" is missing.'
  missingApplicationName: 'Add a tag <meta name="application-name" content="my-application">'
  missingTitle: 'Add a single tag <title>My title</title>, without a lang attribute'
  missingDesc: 'Add a single tag <meta name="description" content="My description">, without a lang attribute'
  missingDFOverflow: 'Deprecated, prefer the modern resizing modes. Set it to "true" if the application manages its own scrolling.'
  missingDFSyncState: 'Set it to "true" to signify that the application maintains its state in its URL and can be synchronized with the parent URL.'
  missingDFFilterConcepts: 'Set it to "true" to signify that the application supports filtering its datasets based on concepts values.'
  missingDFVsf: 'Set it to "3" to use the modern v3 application configuration edition. You will need to upgrade the schema with the newest annotations (layout instead of x-display, etc).'
  missingDFSyncConfig: 'Set it to "true" if your application supports dynamic configuration reloading through postMessage.'
  missingDFCaptureDelay: 'Optional: after network idle, the capture service waits for window.triggerCapture() up to this number of seconds before capturing anyway. Sane values are 1 to 5, and it is a safety net, not the normal path.'
  optionalDFCaptureWidth: 'Optional: prefills the back-office capture dialog and sizes the portal capture button. It does NOT change the default thumbnail, hardcoded at 1050x450.'
  optionalDFCaptureHeight: 'Optional: prefills the back-office capture dialog and sizes the portal capture button. It does NOT change the default thumbnail, hardcoded at 1050x450.'
  metaForbiddenTitle: 'Metadata "{name}" is deprecated or has no consumer, remove it.'
  forbiddenXCapture: 'Deprecated: use df:capture-delay together with an explicit call to window.triggerCapture(). An app that keeps x-capture without ever calling triggerCapture makes the capture service wait for its full timeout on every screenshot.'
  forbiddenConceptFilters: 'Canonical name is df:filter-concepts, not df:concept-filters. Use df:filter-concepts (with the value "true").'
  forbiddenKeywords: 'No consumer anywhere: it is extracted in baseApp.meta.keywords but never read again. Remove it.'
  forbiddenThumbnailMeta: 'No consumer: baseApp.image is computed as url + "thumbnail.png", the presence of the public/thumbnail.png file is what matters. Remove this meta tag.'
  forbiddenVocabulary: 'No consumer: filters on datasets are deduced from config-schema.json and stored in datasetsFilters. Remove it.'
  forbiddenVersionMeta: 'baseApp.version is deduced from the version segment of the app url, or entered in administration. This meta has no consumer. Remove it.'
  forbiddenTitleMeta: 'Abandoned: <title> carries the model name for the catalog, and a <meta name="title"> overrides it in baseApp.meta.title while being read by no one. Remove it and keep only the <title> element.'
  forbiddenVersionPlaceholder: 'Build artifact: a meta literally named {''{''}VERSION{''}''} was published in 32 base apps. Nothing substitutes it, it serves nothing and pollutes the catalog. Remove it, and check no unsubstituted placeholder remains in index.html.'
fr:
  metaMissingTitle: 'La métadonnée "{name}" est manquante.'
  missingApplicationName: 'Ajoutez une balise <meta name="application-name" content="my-application">'
  missingTitle: 'Ajoutez une unique balise <title>Mon titre</title>, sans attribut lang'
  missingDesc: 'Ajoutez une unique balise <meta name="description" content="Ma description">, sans attribut lang'
  missingDFOverflow: 'Déprécié, préférez les modes de redimensionnement modernes. Définissez-la à "true" si l''application gère son propre défilement.'
  missingDFSyncState: 'Définissez-la à "true" pour indiquer que l''application maintient son état dans son URL et peut être synchronisée avec l''URL parente.'
  missingDFFilterConcepts: 'Définissez-la à "true" pour indiquer que l''application sait filtrer ses jeux de données selon les valeurs de concepts.'
  missingDFVsf: 'Définissez-la à "3" pour utiliser l''édition de configuration moderne v3. Vous devrez mettre à jour le schéma avec les nouvelles annotations (layout au lieu de x-display, etc).'
  missingDFSyncConfig: 'Définissez-la à "true" si votre application gère le rechargement dynamique de configuration via postMessage.'
  missingDFCaptureDelay: 'Optionnel : après un network idle, le service de capture attend window.triggerCapture() jusqu''à ce nombre de secondes avant de capturer quand même. Valeurs saines : 1 à 5, et c''est un filet de sécurité, pas le chemin normal.'
  optionalDFCaptureWidth: 'Optionnel : préremplit le dialogue de capture du back-office et dimensionne le bouton de capture des portails. Ne change PAS la miniature par défaut, codée en dur à 1050x450.'
  optionalDFCaptureHeight: 'Optionnel : préremplit le dialogue de capture du back-office et dimensionne le bouton de capture des portails. Ne change PAS la miniature par défaut, codée en dur à 1050x450.'
  metaForbiddenTitle: 'La métadonnée "{name}" est dépréciée ou sans consommateur, retirez-la.'
  forbiddenXCapture: 'Déprécié : utilisez df:capture-delay avec un appel explicite à window.triggerCapture(). Une app qui garde x-capture sans jamais appeler triggerCapture fait attendre le timeout complet du service de capture à chaque capture.'
  forbiddenConceptFilters: 'Le nom canonique est df:filter-concepts, pas df:concept-filters. Utilisez df:filter-concepts (avec la valeur "true").'
  forbiddenKeywords: 'Aucun consommateur : la valeur est extraite dans baseApp.meta.keywords mais jamais relue. Retirez-la.'
  forbiddenThumbnailMeta: 'Aucun consommateur : baseApp.image est calculé comme url + "thumbnail.png", c''est la présence du fichier public/thumbnail.png qui compte. Retirez cette balise méta.'
  forbiddenVocabulary: 'Aucun consommateur : les filtres sur jeux de données sont déduits de config-schema.json et stockés dans datasetsFilters. Retirez-la.'
  forbiddenVersionMeta: 'baseApp.version est déduit du segment de version de l''URL, ou saisi en administration. Cette méta n''a aucun consommateur. Retirez-la.'
  forbiddenTitleMeta: 'Abandonnée : <title> porte le nom du modèle au catalogue, et une <meta name="title"> l''écrase dans baseApp.meta.title sans être lue par personne. Retirez-la et ne gardez que l''élément <title>.'
  forbiddenVersionPlaceholder: 'Artefact de build : une méta littéralement nommée {''{''}VERSION{''}''} a été publiée dans 32 apps de base. Rien ne la substitue, elle ne sert à rien et pollue le catalogue. Retirez-la, et vérifiez qu''aucun placeholder non substitué ne subsiste dans index.html.'
</i18n>
