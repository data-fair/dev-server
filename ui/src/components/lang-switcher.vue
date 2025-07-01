<template lang="html">
  <v-speed-dial
    v-if="locales.length > 1"
    direction="bottom"
    transition="fade-transition"
  >
    <template #activator>
      <v-btn
        size="small"
        class="mx-2"
      >
        {{ $i18n.locale }}
      </v-btn>
    </template>
    <v-btn
      v-for="l in locales.filter(l => l !== locale)"
      :key="l"
      size="small"
      @click="setLocale(l)"
    >
      {{ l }}
    </v-btn>
  </v-speed-dial>
</template>

<script lang="ts" setup>
const locales = ['fr', 'en']

const { locale } = useI18n()

const setLocale = (l: string) => {
  locale.value = l
  window.location.reload()
}
</script>

<style lang="css">
</style>
