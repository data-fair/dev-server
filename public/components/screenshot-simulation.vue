<template>
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="1100px"
  >
    <template #activator="{on}">
      <v-btn
        color="primary"
        text
        v-on="on"
      >
        Simulate screenshot
      </v-btn>
    </template>
    <v-card>
      <v-card-title primary-title>
        Screenshot simulation
      </v-card-title>
      <v-card-text>
        <p>Data Fair will automatically render the visualization after each configuration change and take a screenshot to be used as a thumbnail.</p>
        <p>The screenshot will be rendered in a box of 1050x450 pixels (21/9 resolution) and the URL will have the query parameter ?thumbnail=true.</p>
        <p>For performance it is a recommended to call the window.triggerCapture method as soon as the application is fully rendered. For guidance look for messages prefixed with "[capture]" in your browser developper's console.</p>
        <v-iframe
          v-if="dialog"
          style="border: 1px solid grey;width: 1050px;"
          :aspect-ratio="21/9"
          src="http://localhost:5888/app?thumbnail=true"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import VIframe from '@koumoul/v-iframe'

export default {
  components: { VIframe },
  data () {
    return { dialog: false }
  }
}
</script>

<style lang="css" scoped>
</style>
