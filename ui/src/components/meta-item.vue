<template>
  <p
    v-if="mode === 'missing' && present"
    class="mb-2"
  >
    <b>{{ label }}:</b> <slot />
  </p>
  <v-alert
    v-if="mode === 'missing' && !present"
    :type="severity"
    :title="t('metaMissingTitle', { name: label })"
    :text="t(missingKey)"
    density="compact"
    class="mb-2"
  />
  <v-alert
    v-if="mode === 'forbidden' && present"
    :type="severity"
    :title="t('metaForbiddenTitle', { name: label })"
    :text="t(missingKey)"
    density="compact"
    class="mb-2"
  />
</template>

<script lang="ts" setup>
defineProps<{
  label: string
  present: boolean
  severity: 'error' | 'info' | 'warning'
  missingKey: string
  mode?: 'missing' | 'forbidden'
}>()

const { t } = useI18n()
</script>

<i18n lang="yaml">
en:
  metaMissingTitle: 'Metadata "{name}" is missing.'
  metaForbiddenTitle: 'Metadata "{name}" is deprecated or has no consumer, remove it.'
  missingApplicationName: 'Add a tag <meta name="application-name" content="my-application">'
  missingTitle: 'Add a single tag <title>My title</title>, without a lang attribute'
  missingDesc: 'Add a single tag <meta name="description" content="My description">, without a lang attribute'
  missingDFOverflow: 'Set it to "true" to signify that the application might overflow its initial boundaries and require either resizing of these boundaries or scroll bars.'
  missingDFSyncState: 'Set it to "true" to signify that the application can have some state synchronized in its url (path and query params) that might be used by portals to create more useful links and screenshots.'
  missingDFFilterConcepts: 'Set it to "true" to signify that the application supports filtering its datasets based on concepts values.'
  missingDFVsf: 'Set it to "3" to use the modern v3 application configuration edition. You will need to upgrade the schema with the newest annotations (layout instead of x-display, etc).'
  missingDFSyncConfig: 'Set it to "true" if your application supports dynamic configuration reloading through postMessage.'
  missingDFCaptureDelay: 'Optional: after network idle, the capture service waits for window.triggerCapture() up to this number of seconds before capturing anyway. Only useful if the app does not call triggerCapture reliably.'
  missingThumbnailFile: 'Add a public/thumbnail.png file. The image presence at the root is what matters: data-fair computes baseApp.image as url + "thumbnail.png". The thumbnail meta tag is never read.'
  missingConfigSchemaFile: 'Add a public/config-schema.json file (generated from src/config/schema.json with df-build-types). Never rename nor move it.'
  forbiddenXCapture: 'Deprecated: use df:capture-delay together with an explicit call to window.triggerCapture(). An app that keeps x-capture without ever calling triggerCapture makes the capture service wait for its full timeout on every screenshot.'
  forbiddenConceptFilters: 'Canonical name is df:filter-concepts, not df:concept-filters. Use df:filter-concepts (with the value "true").'
  forbiddenKeywords: 'No consumer anywhere: it is extracted in baseApp.meta.keywords but never read again. Remove it.'
  forbiddenThumbnailMeta: 'No consumer: baseApp.image is computed as url + "thumbnail.png", the presence of the public/thumbnail.png file is what matters. Remove this meta tag.'
  forbiddenVocabulary: 'No consumer: filters on datasets are deduced from config-schema.json and stored in datasetsFilters. Remove it.'
  forbiddenVersionMeta: 'baseApp.version is deduced from the version segment of the app url, or entered in administration. This meta has no consumer. Remove it.'
  forbiddenTitleMeta: 'Abandoned: <title> carries the model name for the catalog. A <meta name="title"> would override it and is read by no one. Remove it.'
  forbiddenVersionPlaceholder: 'Build artifact: a literal "{VERSION}" placeholder was published in 32 base apps, it serves nothing and pollutes the catalog. Remove it.'
  duplicateTitle: 'Add a single <title> element. Duplicating it with a lang attribute is invalid HTML and produces two W3C errors.'
  duplicateDescription: 'Add a single <meta name="description">. Duplicating it with a lang attribute is invalid HTML and produces two W3C errors.'
  charsetNotFirst: 'The <meta charset> must be the first element of <head>, within the first 1024 bytes. A comment placed before it pushes it out of this window and breaks validation.'
fr:
  metaMissingTitle: 'La métadonnée "{name}" est manquante.'
  metaForbiddenTitle: 'La métadonnée "{name}" est dépréciée ou sans consommateur, retirez-la.'
  missingApplicationName: 'Ajoutez une balise <meta name="application-name" content="my-application">'
  missingTitle: 'Ajoutez une unique balise <title>Mon titre</title>, sans attribut lang'
  missingDesc: 'Ajoutez une unique balise <meta name="description" content="Ma description">, sans attribut lang'
  missingDFOverflow: 'Définissez-la à "true" pour indiquer que l''application peut déborder de ses limites initiales et nécessiter un redimensionnement ou des barres de défilement.'
  missingDFSyncState: 'Définissez-la à "true" pour indiquer que l''application peut synchroniser un état dans son URL (chemin et paramètres) que les portails peuvent utiliser pour créer des liens et captures plus utiles.'
  missingDFFilterConcepts: 'Définissez-la à "true" pour indiquer que l''application sait filtrer ses jeux de données selon les valeurs de concepts.'
  missingDFVsf: 'Définissez-la à "3" pour utiliser l''édition de configuration moderne v3. Vous devrez mettre à jour le schéma avec les nouvelles annotations (layout au lieu de x-display, etc).'
  missingDFSyncConfig: 'Définissez-la à "true" si votre application gère le rechargement dynamique de configuration via postMessage.'
  missingDFCaptureDelay: 'Optionnel : après un network idle, le service de capture attend window.triggerCapture() jusqu''à ce nombre de secondes avant de capturer quand même. Utile uniquement si l''application n''appelle pas triggerCapture de façon fiable.'
  missingThumbnailFile: 'Ajoutez un fichier public/thumbnail.png. C''est la présence du fichier à la racine qui compte : data-fair calcule baseApp.image comme url + "thumbnail.png". La balise méta thumbnail n''est jamais lue.'
  missingConfigSchemaFile: 'Ajoutez un fichier public/config-schema.json (généré depuis src/config/schema.json avec df-build-types). Ne le renommez ni ne le déplacez jamais.'
  forbiddenXCapture: 'Déprécié : utilisez df:capture-delay avec un appel explicite à window.triggerCapture(). Une app qui garde x-capture sans jamais appeler triggerCapture fait attendre le timeout complet du service de capture à chaque capture.'
  forbiddenConceptFilters: 'Le nom canonique est df:filter-concepts, pas df:concept-filters. Utilisez df:filter-concepts (avec la valeur "true").'
  forbiddenKeywords: 'Aucun consommateur : la valeur est extraite dans baseApp.meta.keywords mais jamais relue. Retirez-la.'
  forbiddenThumbnailMeta: 'Aucun consommateur : baseApp.image est calculé comme url + "thumbnail.png", c''est la présence du fichier public/thumbnail.png qui compte. Retirez cette balise méta.'
  forbiddenVocabulary: 'Aucun consommateur : les filtres sur jeux de données sont déduits de config-schema.json et stockés dans datasetsFilters. Retirez-la.'
  forbiddenVersionMeta: 'baseApp.version est déduit du segment de version de l''URL, ou saisi en administration. Cette méta n''a aucun consommateur. Retirez-la.'
  forbiddenTitleMeta: 'Abandonnée : <title> porte le nom du modèle au catalogue. Une <meta name="title"> l''écraserait et n''est lue par personne. Retirez-la.'
  forbiddenVersionPlaceholder: 'Artefact de build : un placeholder littéral "{VERSION}" a été publié dans 32 apps de base, il ne sert à rien et pollue le catalogue. Retirez-le.'
  duplicateTitle: 'Ajoutez une unique balise <title>. La dupliquer avec un attribut lang est du HTML invalide et produit deux erreurs W3C.'
  duplicateDescription: 'Ajoutez une unique balise <meta name="description">. La dupliquer avec un attribut lang est du HTML invalide et produit deux erreurs W3C.'
  charsetNotFirst: 'La balise <meta charset> doit être le premier élément du <head>, dans les 1024 premiers octets. Un commentaire placé avant la repousse hors de cette fenêtre et casse la validation.'
</i18n>
