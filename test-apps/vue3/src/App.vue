<template>
  <v-app>
    <v-main>
      <v-container fluid>
        <v-row>
          <v-col>Search params: {{ searchParams }}</v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-btn class="mr-2" color="primary" @click="searchParams.param = 'test'">set query param</v-btn>
            <v-btn color="warning" @click="delete searchParams.param">delete query param</v-btn>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            Application: {{application}}
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useUrlSearchParams } from '@vueuse/core'
import { application } from '@data-fair/lib/vue/app-info.js'

const searchParams = useUrlSearchParams('history')

// @ts-ignore
window.vIframeOptions = { reactiveParams: searchParams }
</script>
