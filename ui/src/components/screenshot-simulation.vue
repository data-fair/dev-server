<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="1100px"
  >
    <template #activator="{props}">
      <v-btn
        color="primary"
        variant="text"
        v-bind="props"
      >
        Simulate screenshot
      </v-btn>
    </template>
    <v-card variant="flat">
      <v-card-title primary-title>
        Screenshot simulation
      </v-card-title>
      <v-card-text>
        <p>Data Fair will automatically render the visualization after each configuration change and take a screenshot to be used as a thumbnail.</p>
        <p>The screenshot for the thumbnail will be rendered in a box of 1050x450 pixels (21/9 resolution) and the URL will have the query parameter ?thumbnail=true.</p>
        <p>Screenshots can also be created manually including with a state persisted in query parameters (see df:sync-state meta). Animated screenshots can also beexported to gif files.</p>
        <p>Portals will look for the metas df:capture-width and df:capture-height to chose default screenshots sizes.</p>
        <p>For performance it is a recommended to call the window.triggerCapture method as soon as the application is fully rendered. For guidance look for messages prefixed with "[capture]" in your browser developper's console.</p>
        <d-frame
          v-if="dialog"
          style="border: 1px solid grey;width: 1050px;"
          :aspect-ratio="21/9"
          resize="false"
          src="/app?thumbnail=true"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
const dialog = ref(false)
</script>

<style lang="css" scoped>
p {
  margin-bottom: 8px;
}
</style>
