<template>
  <v-app>
    <v-main>
      <v-container
        v-if="!configureError"
        fluid
        data-iframe-height
      >
        <main-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ofetch } from 'ofetch'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params.js'
import useAppInfo from './composables/useAppInfo'
import mainView from './components/main-view.vue'

const setError = (/** @type {string} */message) => {
  // @ts-ignore
  ofetch(window.APPLICATION.href + '/error', { body: { message }, method: 'POST' })
}

/** @type {string} */
let configureError
try {
  useAppInfo()
} catch (/** @type{any} */e) {
  configureError = /** @type {string} */(e.message)
  setError(configureError)
}

// @ts-ignore
window.vIframeOptions = { reactiveParams: reactiveSearchParams }
// @ts-ignore
window.iFrameResizer = { heightCalculationMethod: 'taggedElement' }
</script>
