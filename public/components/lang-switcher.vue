<template lang="html">
  <v-speed-dial
    v-if="locales.length > 1"
    direction="bottom"
    transition="fade-transition"
  >
    <template #activator>
      <v-btn
        fab
        small
        class="mx-2"
      >
        {{ $i18n.locale }}
      </v-btn>
    </template>
    <v-btn
      v-for="locale in locales.filter(l => l !== $i18n.locale)"
      :key="locale"
      fab
      small
      nuxt
      @click="setLocale(locale)"
    >
      {{ locale }}
    </v-btn>
  </v-speed-dial>
</template>

<script>
export default {
  computed: {
    locales () {
      return process.env.locales
    }
  },
  methods: {
    setLocale (locale) {
      this.$i18n.setLocale(locale)
      window.location.reload()
    }
  }
}
</script>

<style lang="css">
</style>
