<template>
  <v-row>
    <v-col>Search params: {{ reactiveSearchParams }}</v-col>
  </v-row>
  <v-row>
    <v-col>
      <v-btn
        class="mr-2"
        color="primary"
        @click="reactiveSearchParams.param = 'test'"
      >
        set query param
      </v-btn>
      <v-btn
        class="mr-2"
        color="warning"
        @click="delete reactiveSearchParams.param"
      >
        delete query param
      </v-btn>
      <v-btn
        color="error"
        @click="setError('test error')"
      >
        send error to parent
      </v-btn>
    </v-col>
  </v-row>
  <v-row>
    <v-col>
      Application: {{ application }}
    </v-col>
  </v-row>
</template>

<script setup>
import { ofetch } from 'ofetch'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params.js'
import useAppInfo from '../composables/useAppInfo'

const { application } = useAppInfo()

const setError = (/** @type {string} */message) => {
  ofetch(application.href + '/error', { body: { message }, method: 'POST' })
}
</script>
